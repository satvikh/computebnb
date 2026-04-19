import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { calculateSuccessRate, formatJob, getDbUnavailablePayload } from "@/lib/marketplace";
import { Job, Machine, JobEvent } from "@/lib/models";
import { requireProvider } from "@/lib/provider-auth";

const schema = z.object({
  machineId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  error: z.string().optional(),
  stderr: z.string().optional(),
  stdout: z.string().optional(),
  exitCode: z.coerce.number().int().optional(),
  message: z.string().optional(),
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

    const [job, machine] = await Promise.all([
      Job.findOne({ _id: id, machineId }),
      Machine.findById(machineId)
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
    job.stdout = input.stdout ?? job.stdout ?? "";
    job.stderr = input.stderr ?? failureReason;
    job.exitCode = input.exitCode ?? 1;
    job.failureReason = failureReason;
    job.error = failureReason;
    job.actualRuntimeSeconds = Math.max(
      1,
      Math.round((completedAt.getTime() - (job.startedAt?.getTime() ?? completedAt.getTime())) / 1000)
    );
    await job.save();

    machine.failedJobs += 1;
    machine.successRate = calculateSuccessRate(machine.completedJobs, machine.failedJobs);
    machine.lastHeartbeatAt = completedAt;
    machine.status = "online";
    await machine.save();

    await JobEvent.create({
      jobId: id,
      machineId,
      type: "failed",
      message: input.message ?? failureReason,
    });

    return NextResponse.json({ job: formatJob(job, machine.name) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid failure payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to fail job" }, { status: 500 });
  }
}
