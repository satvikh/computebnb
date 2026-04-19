import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { formatJob, getDbUnavailablePayload } from "@/lib/marketplace";
import { Assignment, Job, JobEvent } from "@/lib/models";
import { requireProvider } from "@/lib/provider-auth";

const schema = z.object({
  providerId: z.string().min(1),
  message: z.string().default("Worker reported progress"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json());
    const auth = await requireProvider(request, input.providerId);
    if (auth.response) return auth.response;

    const assignment = await Assignment.findOne({
      jobId: id,
      providerId: input.providerId,
      status: "running"
    });
    if (!assignment) {
      return NextResponse.json({ error: "Running provider mismatch" }, { status: 403 });
    }

    const job = await Job.findByIdAndUpdate(id, { $set: { status: "running" } }, { new: true });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await JobEvent.create({
      jobId: id,
      providerId: input.providerId,
      type: "progress",
      message: input.message
    });

    return NextResponse.json({ job: formatJob(job) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to report progress" }, { status: 500 });
  }
}
