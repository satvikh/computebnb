import { Provider, Job, Assignment, JobEvent } from "@/lib/models";
import type { IAssignment } from "@/lib/models";
import { HEARTBEAT_STALE_MS, MAX_JOB_RETRIES } from "@/lib/marketplace";

async function requeueOrFailJob(jobId: string, providerId: string | null, reason: string) {
  const job = await Job.findById(jobId);
  if (!job) return;

  const nextRetryCount = (job.retryCount ?? 0) + 1;
  const shouldRetry = nextRetryCount <= MAX_JOB_RETRIES;

  if (providerId) {
    await Provider.findByIdAndUpdate(providerId, { $set: { status: "offline" }, $inc: { failedJobs: 1 } });
    const provider = await Provider.findById(providerId).lean();
    if (provider) {
      const total = (provider.completedJobs ?? 0) + (provider.failedJobs ?? 0);
      const successRate = total === 0 ? 100 : Number((((provider.completedJobs ?? 0) / total) * 100).toFixed(1));
      await Provider.findByIdAndUpdate(providerId, { $set: { successRate } });
    }
  }

  await Assignment.findOneAndDelete({ jobId });

  await JobEvent.create({
    jobId,
    providerId: providerId || undefined,
    type: "failed",
    message: reason
  });

  if (shouldRetry) {
    await Job.findByIdAndUpdate(jobId, {
      $set: {
        status: "queued",
        failureReason: reason,
        error: reason
      },
      $inc: {
        retryCount: 1
      },
      $unset: {
        assignedProviderId: 1,
        startedAt: 1,
        completedAt: 1,
        actualRuntimeSeconds: 1
      }
    });

    await JobEvent.create({
      jobId,
      type: "created",
      message: `Requeued after failure: ${reason}`
    });
    return;
  }

  await Job.findByIdAndUpdate(jobId, {
    $set: {
      status: "failed",
      failureReason: reason,
      error: reason,
      completedAt: new Date()
    },
    $inc: {
      retryCount: 1
    }
  });
}

export async function reapStaleAssignments() {
  const heartbeatCutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);
  const staleAssignments = await Assignment.find({
    status: { $in: ["assigned", "running"] },
    updatedAt: { $lte: heartbeatCutoff }
  }).lean();

  for (const assignment of staleAssignments) {
    const provider = await Provider.findById(assignment.providerId).lean();
    const lastHeartbeatAt = provider?.lastHeartbeatAt?.getTime() ?? 0;
    if (lastHeartbeatAt && lastHeartbeatAt >= heartbeatCutoff.getTime()) {
      continue;
    }

    await requeueOrFailJob(
      String(assignment.jobId),
      provider ? String(provider._id) : null,
      "Provider heartbeat timed out during execution"
    );
  }
}

/**
 * Simple hackathon scheduler: pick the first compatible idle provider
 * with a recent heartbeat and assign the first queued job.
 *
 * Uses atomic findOneAndUpdate calls to avoid double-assigning.
 */
export async function assignNextJob(): Promise<IAssignment | null> {
  await reapStaleAssignments();

  // 1. Find the first queued job
  const job = await Job.findOne({ status: "queued" }).sort({ createdAt: 1 });
  if (!job) return null;

  // 2. Find a compatible idle provider with a recent heartbeat
  const heartbeatCutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);
  const provider = await Provider.findOneAndUpdate(
    {
      status: "online",
      lastHeartbeatAt: { $gte: heartbeatCutoff },
      capabilities: { $all: job.requiredCapabilities ?? [] },
    },
    { $set: { status: "busy" } },
    { new: true }
  );
  if (!provider) return null;

  // 3. Atomically claim the job so no other scheduler picks it
  const claimed = await Job.findOneAndUpdate(
    { _id: job._id, status: "queued" },
    { $set: { status: "assigned" } },
    { new: true }
  );
  if (!claimed) {
    // Another request claimed it — roll back provider status
    await Provider.findByIdAndUpdate(provider._id, { status: "online" });
    return null;
  }

  // 4. Create the assignment
  const assignment = await Assignment.create({
    jobId: claimed._id,
    providerId: provider._id,
    status: "assigned",
  }).catch(async (caught: unknown) => {
    await Job.findByIdAndUpdate(claimed._id, { status: "queued" });
    await Provider.findByIdAndUpdate(provider._id, { status: "online" });
    throw caught;
  });

  claimed.assignedProviderId = provider._id;
  await claimed.save();

  // 5. Log the event
  await JobEvent.create({
    jobId: claimed._id,
    providerId: provider._id,
    type: "assigned",
    message: `Assigned to ${provider.name}`,
  });

  return assignment;
}

/**
 * Return the active assignment (assigned | running) for a given provider.
 */
export async function getAssignmentForProvider(providerId: string) {
  return Assignment.findOne({
    providerId,
    status: { $in: ["assigned", "running"] },
  });
}

export async function markStaleProvidersOffline() {
  const heartbeatCutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);
  return Provider.updateMany(
    {
      status: "online",
      lastHeartbeatAt: { $lt: heartbeatCutoff }
    },
    { $set: { status: "offline" } }
  );
}
