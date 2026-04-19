import { initialWorkerState } from "@/src/mocks/worker-data";
import type { JobLog, WorkerAction, WorkerEvent, WorkerRuntimeSnapshot, WorkerState } from "@/src/types/worker";

function withLog(logs: JobLog[], log: JobLog) {
  return [log, ...logs].slice(0, 40);
}

function applySnapshot(state: WorkerState, snapshot: WorkerRuntimeSnapshot): WorkerState {
  return {
    ...state,
    registered: snapshot.registered,
    availability: snapshot.availability,
    machine: snapshot.machine,
    metrics: snapshot.metrics,
    activeJob: snapshot.activeJob,
    latestOutput: snapshot.latestOutput,
    recentJobs: snapshot.recentJobs,
    earnings: snapshot.earnings,
    settings: snapshot.settings,
    networkOnline: snapshot.networkOnline,
    workerLogs: snapshot.workerLogs.length > 0 ? snapshot.workerLogs : state.workerLogs
  };
}

function applyWorkerEvent(state: WorkerState, event: WorkerEvent): WorkerState {
  switch (event.type) {
    case "snapshot":
      return applySnapshot(state, event.snapshot);
    case "machine_detected":
      return {
        ...state,
        machine: { ...event.machine, status: state.machine.status, lastHeartbeatAt: state.machine.lastHeartbeatAt, uptimeSeconds: state.machine.uptimeSeconds }
      };
    case "machine_registered":
      return {
        ...state,
        registered: true,
        availability: "inactive",
        machine: event.machine,
        settings: event.settings
      };
    case "worker_status_changed":
      return {
        ...state,
        machine: {
          ...state.machine,
          status: event.status,
          lastHeartbeatAt: event.lastHeartbeatAt,
          uptimeSeconds: event.uptimeSeconds
        },
        activeJob: event.status === "offline" && state.activeJob ? { ...state.activeJob, status: "paused" } : state.activeJob
      };
    case "heartbeat":
      return {
        ...state,
        machine: {
          ...state.machine,
          lastHeartbeatAt: event.at,
          uptimeSeconds: event.uptimeSeconds
        },
        metrics: {
          ...state.metrics,
          heartbeatLatencyMs: event.latencyMs
        }
      };
    case "job_assigned":
      return {
        ...state,
        activeJob: event.job,
        latestOutput: {
          jobId: event.job.id,
          jobName: event.job.name,
          state: "running",
          summary: "Current job output is still streaming",
          detail: "The producer is processing one workload at a time on this machine.",
          updatedAt: event.job.startedAt
        },
        machine: { ...state.machine, status: "busy" }
      };
    case "job_progress":
      return {
        ...state,
        activeJob: event.job,
        latestOutput: {
          jobId: event.job.id,
          jobName: event.job.name,
          state: "running",
          summary: `${event.job.progress.toFixed(0)}% complete`,
          detail: event.job.executionOutput ?? "Intermediate output is being produced locally.",
          updatedAt: new Date().toISOString()
        },
        machine: { ...state.machine, status: "busy" }
      };
    case "job_completed":
      return {
        ...state,
        activeJob: null,
        latestOutput: {
          jobId: event.job.id,
          jobName: event.job.name,
          state: event.job.status === "failed" ? "failed" : "ready",
          summary: event.job.status === "failed" ? "Latest output failed verification" : "Latest output ready",
          detail: event.job.executionError ?? event.job.executionOutput ?? "The latest job finished without a detailed artifact summary.",
          updatedAt: event.job.estimatedCompletionAt ?? new Date().toISOString()
        },
        recentJobs: event.recentJobs,
        machine: { ...state.machine, status: "idle" }
      };
    case "metrics_updated":
      return {
        ...state,
        metrics: event.metrics
      };
    case "earnings_updated":
      return {
        ...state,
        earnings: event.earnings
      };
    case "log_emitted":
      return {
        ...state,
        activeJob:
          event.jobId && state.activeJob?.id === event.jobId
            ? { ...state.activeJob, logs: withLog(state.activeJob.logs, event.log).slice(0, 16) }
            : state.activeJob,
        workerLogs: withLog(state.workerLogs, event.log)
      };
    case "settings_updated":
      return {
        ...state,
        settings: event.settings,
        machine: {
          ...state.machine,
          cpuLimit: event.settings.cpuLimit,
          autoAcceptJobs: event.settings.autoAcceptJobs,
          backgroundRunning: event.settings.backgroundRunning,
          chargingOnly: event.settings.chargingOnly
        }
      };
    case "worker_error":
      return {
        ...state,
        machine: { ...state.machine, status: "error" },
        workerLogs: withLog(state.workerLogs, {
          id: `worker-error-${Date.now()}`,
          at: new Date().toISOString(),
          level: "error",
          message: event.message
        })
      };
    default:
      return state;
  }
}

export function reduceWorkerState(state: WorkerState, action: WorkerAction): WorkerState {
  switch (action.type) {
    case "SIGN_IN":
      return {
        ...state,
        signedIn: true,
        userName: action.name,
        workerLogs: withLog(state.workerLogs, {
          id: `sign-in-${Date.now()}`,
          at: new Date().toISOString(),
          level: "info",
          message: `Signed in as ${action.name}.`
        })
      };
    case "UPDATE_SETTINGS": {
      const settings = { ...state.settings, ...action.settings };
      return {
        ...state,
        settings,
        machine: {
          ...state.machine,
          cpuLimit: settings.cpuLimit,
          autoAcceptJobs: settings.autoAcceptJobs,
          backgroundRunning: settings.backgroundRunning,
          chargingOnly: settings.chargingOnly
        }
      };
    }
    case "WORKER_EVENT":
      return applyWorkerEvent(state, action.event);
    case "WORKER_SNAPSHOT":
      return applySnapshot(state, action.snapshot);
    default:
      return state;
  }
}

export function createInitialWorkerState() {
  return initialWorkerState;
}
