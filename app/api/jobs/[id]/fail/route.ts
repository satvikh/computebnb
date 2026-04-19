import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { formatJob } from "@/lib/mvp";
import { Job, Machine } from "@/lib/models";

const schema = z.object({
  machineId: z.string().min(1),
  error: z.string().optional(),
  stderr: z.string().optional(),
  stdout: z.string().default(""),
  exitCode: z.coerce.number().int().default(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json());

    const [job, machine] = await Promise.all([
      Job.findOne({ _id: id, machineId: input.machineId }),
      Machine.findById(input.machineId)
    ]);
    if (!job) {
      return NextResponse.json({ error: "Job not found for machine" }, { status: 404 });
    }
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    if (job.status === "failed") {
      return NextResponse.json({ job: formatJob(job, machine.name) });
    }
    if (job.status === "completed") {
      return NextResponse.json({ error: "Cannot fail a completed job" }, { status: 409 });
    }

    const completedAt = new Date();
    const failureReason = input.error ?? input.stderr ?? "Machine reported failure";

    job.status = "failed";
    job.completedAt = completedAt;
    job.stdout = input.stdout;
    job.stderr = input.stderr ?? failureReason;
    job.exitCode = input.exitCode;
    await job.save();

    machine.status = "active";
    await machine.save();

    return NextResponse.json({ job: formatJob(job, machine.name) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid failure payload", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fail job" }, { status: 500 });
  }
}

export { POST as PATCH };
