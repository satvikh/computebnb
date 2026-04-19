import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { formatJob } from "@/lib/mvp";
import { Job, Machine } from "@/lib/models";

const schema = z.object({
  machineId: z.string().min(1),
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

    const existingJob = await Job.findOne({ _id: id, machineId: input.machineId });
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
      { returnDocument: "after" }
    );
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const machine = await Machine.findByIdAndUpdate(
      input.machineId,
      { $set: { status: "busy" } },
      { returnDocument: "after" }
    ).lean();

    return NextResponse.json({ job: formatJob(job, machine?.name ?? null), message: input.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid progress payload", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to report progress" }, { status: 500 });
  }
}

export { POST as PATCH };
