import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { calculateSuccessRate, formatJob, getDbUnavailablePayload, MAX_JOB_RETRIES } from "@/lib/marketplace";
import { Job, Assignment, Provider, JobEvent } from "@/lib/models";
import { assignNextJob } from "@/lib/scheduling";
import { requireProvider } from "@/lib/provider-auth";

const schema = z.object({
  providerId: z.string().min(1),
  error: z.string().min(1),
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
    const auth = await requireProvider(request, input.providerId);
    if (auth.response) return auth.response;

    const assignment = await Assignment.findOne({
      jobId: id,
      providerId: input.providerId,
      status: { $in: ["assigned", "running"] }
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assigned provider mismatch" }, { status: 403 });
    }

    const [job, provider] = await Promise.all([
      Job.findById(id),
      Provider.findById(input.providerId)
    ]);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    assignment.status = "failed";
    assignment.completedAt = new Date();
    await assignment.save();

    provider.status = "online";
    provider.failedJobs += 1;
    provider.successRate = calculateSuccessRate(provider.completedJobs, provider.failedJobs);
    await provider.save();

    job.error = input.error;
    job.failureReason = input.error;

    const shouldRetry = (job.retryCount ?? 0) < MAX_JOB_RETRIES;
    if (shouldRetry) {
      job.status = "queued";
      job.retryCount += 1;
      job.assignedProviderId = undefined;
      job.startedAt = undefined;
      job.completedAt = undefined;
      job.actualRuntimeSeconds = undefined;
      await job.save();

      await Assignment.findByIdAndDelete(assignment._id);
      await JobEvent.create({
        jobId: id,
        providerId: input.providerId,
        type: "failed",
        message: input.message ?? "Worker failed job"
      });
      await JobEvent.create({
        jobId: id,
        type: "created",
        message: `Requeued after failure: ${input.error}`
      });
      await assignNextJob();
    } else {
      job.status = "failed";
      job.completedAt = new Date();
      job.retryCount += 1;
      await job.save();
      await JobEvent.create({
        jobId: id,
        providerId: input.providerId,
        type: "failed",
        message: input.message ?? "Worker failed job"
      });
      await assignNextJob();
    }

    return NextResponse.json({ job: formatJob(job, provider.name) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to fail job" }, { status: 500 });
  }
}
