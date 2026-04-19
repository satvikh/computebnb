import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { formatJob, getDbUnavailablePayload } from "@/lib/marketplace";
import { Provider, Job } from "@/lib/models";
import { getAssignmentForProvider, assignNextJob, reapStaleAssignments } from "@/lib/scheduling";
import { requireProvider } from "@/lib/provider-auth";

const schema = z.object({
  providerId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    await reapStaleAssignments();
    const input = schema.parse(await request.json());
    const auth = await requireProvider(request, input.providerId);
    if (auth.response) return auth.response;

    const provider = await Provider.findByIdAndUpdate(
      input.providerId,
      { $set: { lastHeartbeatAt: new Date() } },
      { new: true }
    );
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (provider.status !== "busy") {
      provider.status = "online";
      await provider.save();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let assignment: any = await getAssignmentForProvider(input.providerId);

    if (!assignment) {
      const newAssignment = await assignNextJob();
      if (newAssignment && newAssignment.providerId.toString() === input.providerId) {
        assignment = newAssignment;
      }
    }

    if (!assignment) {
      return NextResponse.json({ assignment: null, job: null });
    }

    const job = await Job.findById(assignment.jobId).lean();

    return NextResponse.json({
      assignment: {
        id: String(assignment._id),
        jobId: String(assignment.jobId),
        providerId: String(assignment.providerId),
        status: assignment.status,
        startedAt: assignment.startedAt,
        completedAt: assignment.completedAt,
        createdAt: assignment.createdAt
      },
      job: job ? formatJob(job) : null
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to poll for work" }, { status: 500 });
  }
}
