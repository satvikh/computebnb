import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Job, Assignment, JobEvent } from "@/lib/models";
import { formatJob, getDbUnavailablePayload } from "@/lib/marketplace";

const schema = z.object({
  providerId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json().catch(() => ({})));

    const assignment = await Assignment.findOne({
      jobId: id,
      providerId: input.providerId,
      status: "assigned"
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assigned provider mismatch" }, { status: 403 });
    }

    const startedAt = new Date();
    assignment.status = "running";
    assignment.startedAt = startedAt;
    await assignment.save();

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: { status: "running", startedAt } },
      { new: true }
    );
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await JobEvent.create({
      jobId: id,
      providerId: input.providerId,
      type: "started",
      message: "Worker started execution"
    });

    return NextResponse.json({ job: formatJob(job) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }
}
