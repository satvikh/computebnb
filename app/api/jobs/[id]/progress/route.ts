import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { formatJob, getDbUnavailablePayload } from "@/lib/marketplace";
import { Job, JobEvent, Machine } from "@/lib/models";
import { requireProvider } from "@/lib/provider-auth";

const schema = z.object({
  machineId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  message: z.string().default("Worker reported progress"),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json());
    const machineId = input.machineId ?? input.providerId;
    if (!machineId) {
      return NextResponse.json({ error: "machineId is required" }, { status: 400 });
    }

    const auth = await requireProvider(request, machineId);
    if (auth.response) return auth.response;

    const existingJob = await Job.findOne({ _id: id, machineId });
    if (!existingJob) {
      return NextResponse.json({ error: "Job not found for machine" }, { status: 404 });
    }

    const startedAt = existingJob.startedAt ?? new Date();
    const job = await Job.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "running",
          startedAt,
          stdout: input.stdout ?? existingJob.stdout,
          stderr: input.stderr ?? existingJob.stderr,
        },
      },
      { new: true }
    );
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await Machine.findByIdAndUpdate(machineId, {
      $set: { status: "busy", lastHeartbeatAt: new Date() },
    });

    await JobEvent.create({
      jobId: id,
      machineId,
      type: "progress",
      message: input.message,
    });

    return NextResponse.json({ job: formatJob(job, auth.provider?.name ?? null) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid progress payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to report progress" }, { status: 500 });
  }
}
