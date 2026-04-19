import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Job, Assignment, Provider, JobEvent } from "@/lib/models";
import { buildProofHash, calculateSuccessRate, formatJob, getDbUnavailablePayload } from "@/lib/marketplace";
import { calculateRuntimePricing } from "@/lib/pricing";
import { assignNextJob } from "@/lib/scheduling";

const schema = z.object({
  providerId: z.string().min(1),
  result: z.string().min(1),
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

    const assignment = await Assignment.findOne({
      jobId: id,
      providerId: input.providerId,
      status: "running"
    });
    if (!assignment) {
      return NextResponse.json({ error: "Running provider mismatch" }, { status: 403 });
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

    const completedAt = new Date();
    const runtimeSeconds = Math.max(
      1,
      Math.round((completedAt.getTime() - (assignment.startedAt?.getTime() ?? job.startedAt?.getTime() ?? job.createdAt.getTime())) / 1000)
    );
    const { jobCostCents, providerPayoutCents, platformFeeCents } = calculateRuntimePricing({
      runtimeSeconds,
      hourlyRateCents: provider.hourlyRateCents,
      budgetCents: job.budgetCents
    });

    assignment.status = "completed";
    assignment.completedAt = completedAt;
    await assignment.save();

    job.status = "completed";
    job.result = input.result;
    job.completedAt = completedAt;
    job.actualRuntimeSeconds = runtimeSeconds;
    job.jobCostCents = jobCostCents;
    job.providerPayoutCents = providerPayoutCents;
    job.platformFeeCents = platformFeeCents;
    job.proofHash = buildProofHash(input.result);
    await job.save();

    provider.status = "online";
    provider.totalEarnedCents += providerPayoutCents;
    provider.completedJobs += 1;
    provider.successRate = calculateSuccessRate(provider.completedJobs, provider.failedJobs);
    await provider.save();

    await JobEvent.create({
      jobId: id,
      providerId: input.providerId,
      type: "completed",
      message: input.message ?? `Worker completed job · checksum ${job.proofHash}`
    });

    await assignNextJob();

    return NextResponse.json({ job: formatJob(job, provider.name) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to complete job" }, { status: 500 });
  }
}
