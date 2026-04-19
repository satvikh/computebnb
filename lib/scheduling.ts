import { Job, JobEvent, Machine } from "@/lib/models";
import { HEARTBEAT_STALE_MS } from "@/lib/marketplace";

export interface SchedulingAssignment {
  _id: string;
  jobId: string;
  providerId: string;
  status: "assigned" | "running";
  startedAt: Date | null;
  completedAt: null;
  createdAt: Date;
}

function syntheticAssignment(
  jobId: string,
  machineId: string,
  createdAt: Date,
  startedAt?: Date | null
): SchedulingAssignment {
  return {
    _id: `job-${jobId}`,
    jobId,
    providerId: machineId,
    status: startedAt ? "running" : "assigned",
    startedAt: startedAt ?? null,
    completedAt: null,
    createdAt,
  };
}

async function markJobFailedForOfflineMachine(jobId: string, machineId: string, reason: string) {
  const completedAt = new Date();

  const job = await Job.findOneAndUpdate(
    { _id: jobId, status: "running" },
    {
      $set: {
        status: "failed",
        completedAt,
        exitCode: 1,
        failureReason: reason,
        error: reason,
      },
    },
    { new: true }
  );

  if (!job) {
    return;
  }

  await Machine.findByIdAndUpdate(machineId, {
    $set: { status: "offline" },
    $inc: { failedJobs: 1 },
  });

  await JobEvent.create({
    jobId: job._id,
    machineId,
    type: "failed",
    message: reason,
  });
}

export async function reapStaleAssignments() {
  const heartbeatCutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);
  const staleMachines = await Machine.find({
    status: { $in: ["online", "busy"] },
    lastHeartbeatAt: { $lt: heartbeatCutoff },
  }).lean();

  if (!staleMachines.length) {
    return;
  }

  await Machine.updateMany(
    { _id: { $in: staleMachines.map((machine) => machine._id) } },
    { $set: { status: "offline" } }
  );

  for (const machine of staleMachines) {
    const runningJobs = await Job.find({
      machineId: machine._id,
      status: "running",
    }).lean();

    for (const job of runningJobs) {
      await markJobFailedForOfflineMachine(
        String(job._id),
        String(machine._id),
        "Machine heartbeat timed out during execution"
      );
    }
  }
}

export async function assignNextJob(): Promise<SchedulingAssignment | null> {
  return null;
}

export async function getAssignmentForProvider(providerId: string): Promise<SchedulingAssignment | null> {
  const job = await Job.findOne({
    machineId: providerId,
    status: { $in: ["queued", "running"] },
  })
    .sort({ status: 1, createdAt: 1 })
    .lean();

  if (!job) {
    return null;
  }

  return syntheticAssignment(
    String(job._id),
    String(job.machineId),
    job.createdAt,
    job.startedAt ?? null
  );
}

export async function markStaleProvidersOffline() {
  const heartbeatCutoff = new Date(Date.now() - HEARTBEAT_STALE_MS);

  return Machine.updateMany(
    {
      status: { $in: ["online", "busy"] },
      lastHeartbeatAt: { $lt: heartbeatCutoff },
    },
    { $set: { status: "offline" } }
  );
}
