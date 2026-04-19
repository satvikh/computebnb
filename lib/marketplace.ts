import crypto from "crypto";
import dbConnect, { isDbConfigured } from "@/lib/db";
import { Job, JobEvent, Provider } from "@/lib/models";

export const HEARTBEAT_STALE_MS = 30_000;
export const RUNNING_STALE_MS = 30_000;
export const MAX_JOB_RETRIES = 1;

export function calculateSuccessRate(completedJobs: number, failedJobs: number) {
  const total = completedJobs + failedJobs;
  if (total === 0) return 100;
  return Number(((completedJobs / total) * 100).toFixed(1));
}

export function buildProofHash(result: string) {
  return crypto.createHash("sha256").update(result).digest("hex").slice(0, 16);
}

export function formatProvider(provider: {
  _id: unknown;
  name: string;
  status: string;
  capabilities: string[];
  hourlyRateCents: number;
  totalEarnedCents: number;
  completedJobs?: number;
  failedJobs?: number;
  successRate?: number;
  lastHeartbeatAt?: Date | null;
  createdAt?: Date;
}) {
  return {
    id: String(provider._id),
    name: provider.name,
    status: provider.status,
    capabilities: provider.capabilities,
    hourlyRateCents: provider.hourlyRateCents,
    totalEarnedCents: provider.totalEarnedCents,
    completedJobs: provider.completedJobs ?? 0,
    failedJobs: provider.failedJobs ?? 0,
    successRate: provider.successRate ?? calculateSuccessRate(provider.completedJobs ?? 0, provider.failedJobs ?? 0),
    lastHeartbeatAt: provider.lastHeartbeatAt ?? null,
    createdAt: provider.createdAt ?? null
  };
}

export function formatJob(
  job: {
    _id: unknown;
    title: string;
    type: string;
    status: string;
    input: string;
    result?: string | null;
    error?: string | null;
    failureReason?: string | null;
    budgetCents: number;
    assignedProviderId?: string | null;
    retryCount?: number;
    startedAt?: Date | null;
    completedAt?: Date | null;
    actualRuntimeSeconds?: number | null;
    jobCostCents?: number | null;
    providerPayoutCents?: number | null;
    platformFeeCents?: number | null;
    proofHash?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  },
  assignedProviderName?: string | null
) {
  return {
    id: String(job._id),
    title: job.title,
    type: job.type,
    status: job.status,
    input: job.input,
    result: job.result ?? null,
    error: job.error ?? null,
    failureReason: job.failureReason ?? null,
    budgetCents: job.budgetCents,
    assignedProviderId: job.assignedProviderId ?? null,
    assignedProviderName: assignedProviderName ?? null,
    retryCount: job.retryCount ?? 0,
    startedAt: job.startedAt ?? null,
    completedAt: job.completedAt ?? null,
    actualRuntimeSeconds: job.actualRuntimeSeconds ?? null,
    jobCostCents: job.jobCostCents ?? null,
    providerPayoutCents: job.providerPayoutCents ?? null,
    platformFeeCents: job.platformFeeCents ?? null,
    proofHash: job.proofHash ?? null,
    createdAt: job.createdAt ?? null,
    updatedAt: job.updatedAt ?? null
  };
}

export async function getDashboardSummary() {
  await dbConnect();

  const [providers, jobs, events] = await Promise.all([
    Provider.find().sort({ totalEarnedCents: -1, createdAt: 1 }).lean(),
    Job.find().sort({ createdAt: -1 }).limit(8).lean(),
    JobEvent.find().sort({ createdAt: -1 }).limit(12).lean()
  ]);

  const providerIds = Array.from(
    new Set([
      ...jobs.map((job) => job.assignedProviderId).filter(Boolean),
      ...events.map((event) => event.providerId?.toString()).filter(Boolean)
    ])
  ) as string[];

  const providerLookup = new Map(
    (
      providerIds.length
        ? await Provider.find({ _id: { $in: providerIds } }).lean()
        : []
    ).map((provider) => [String(provider._id), provider.name])
  );

  const providerSummary = providers.map(formatProvider);
  const jobSummary = jobs.map((job) =>
    formatJob(job, job.assignedProviderId ? providerLookup.get(job.assignedProviderId) ?? null : null)
  );

  const totalProviderPayoutCents = jobs.reduce((sum, job) => sum + (job.providerPayoutCents ?? 0), 0);
  const totalPlatformFeeCents = jobs.reduce((sum, job) => sum + (job.platformFeeCents ?? 0), 0);

  const providerCounts = {
    online: providerSummary.filter((provider) => provider.status === "online").length,
    busy: providerSummary.filter((provider) => provider.status === "busy").length,
    offline: providerSummary.filter((provider) => provider.status === "offline").length
  };

  const jobCounts = {
    queued: jobSummary.filter((job) => job.status === "queued").length,
    assigned: jobSummary.filter((job) => job.status === "assigned").length,
    running: jobSummary.filter((job) => job.status === "running").length,
    completed: jobSummary.filter((job) => job.status === "completed").length,
    failed: jobSummary.filter((job) => job.status === "failed").length
  };

  return {
    providerCounts,
    jobCounts,
    totalProviderPayoutCents,
    totalPlatformFeeCents,
    recentJobs: jobSummary,
    recentActivity: events.map((event) => ({
      id: String(event._id),
      jobId: String(event.jobId),
      providerId: event.providerId ? String(event.providerId) : null,
      providerName: event.providerId ? providerLookup.get(String(event.providerId)) ?? null : null,
      type: event.type,
      message: event.message,
      createdAt: event.createdAt
    })),
    providers: providerSummary
  };
}

export async function listProvidersSummary() {
  await dbConnect();
  const providers = await Provider.find().sort({ status: 1, totalEarnedCents: -1, name: 1 }).lean();
  return providers.map(formatProvider);
}

export async function listJobsSummary() {
  await dbConnect();
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();
  const providerIds = Array.from(new Set(jobs.map((job) => job.assignedProviderId).filter(Boolean))) as string[];
  const providerLookup = new Map(
    (
      providerIds.length
        ? await Provider.find({ _id: { $in: providerIds } }).lean()
        : []
    ).map((provider) => [String(provider._id), provider.name])
  );

  return jobs.map((job) =>
    formatJob(job, job.assignedProviderId ? providerLookup.get(job.assignedProviderId) ?? null : null)
  );
}

export async function getJobDetail(id: string) {
  await dbConnect();
  const job = await Job.findById(id).lean();
  if (!job) {
    return null;
  }

  const providerName = job.assignedProviderId
    ? (await Provider.findById(job.assignedProviderId).lean())?.name ?? null
    : null;

  const events = await JobEvent.find({ jobId: id }).sort({ createdAt: -1 }).lean();
  const eventProviderIds = Array.from(new Set(events.map((event) => event.providerId?.toString()).filter(Boolean))) as string[];
  const eventProviderLookup = new Map(
    (
      eventProviderIds.length
        ? await Provider.find({ _id: { $in: eventProviderIds } }).lean()
        : []
    ).map((provider) => [String(provider._id), provider.name])
  );

  return {
    job: formatJob(job, providerName),
    events: events.map((event) => ({
      id: String(event._id),
      jobId: String(event.jobId),
      providerId: event.providerId ? String(event.providerId) : null,
      providerName: event.providerId ? eventProviderLookup.get(String(event.providerId)) ?? null : null,
      type: event.type,
      message: event.message,
      createdAt: event.createdAt
    }))
  };
}

export function getDbUnavailablePayload() {
  return {
    error: "Database unavailable",
    configured: isDbConfigured()
  };
}
