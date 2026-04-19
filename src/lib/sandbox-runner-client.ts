import {
  invokeCheckDockerHealth,
  invokeGetSandboxRunnerStatus,
  invokeStartSandboxRunner,
  invokeStopSandboxRunner
} from "@/src/lib/tauri-commands";
import type { DockerHealth, SandboxRunnerStatus } from "@/src/types/worker";

const RUNNER_URL = "http://localhost:4317";

export type SandboxJobState = "queued" | "pulling_image" | "running" | "completed" | "failed" | "timed_out";

export interface SandboxJob {
  id: string;
  type: "python_script" | "inference" | "benchmark_demo";
  state: SandboxJobState;
  image: string;
  command: string[];
  logs: {
    stdout: string;
    stderr: string;
    truncated: boolean;
  };
  result?: {
    exitCode: number | null;
    startTime: string;
    endTime: string;
    durationMs: number;
    logs: SandboxJob["logs"];
    artifactPaths: string[];
    error?: string;
  };
  error?: string;
}

const demoPayload = {
  type: "python_script",
  script: [
    "import pathlib",
    "import time",
    "print('hello from ComputeBNB sandbox')",
    "for i in range(3):",
    "    print(f'tick {i}')",
    "    time.sleep(0.5)",
    "pathlib.Path('/workspace/artifacts').mkdir(exist_ok=True)",
    "pathlib.Path('/workspace/artifacts/output.txt').write_text('sandbox artifact ok\\n')",
    ""
  ].join("\n"),
  limits: {
    timeoutMs: 10000,
    cpus: 1,
    memoryMb: 256,
    pidsLimit: 64
  }
} as const;

export async function checkDockerHealth(): Promise<DockerHealth> {
  const native = await invokeCheckDockerHealth();
  if (native) return native;

  return checkRunnerHealth().then(
    (health) => ({
      ok: health.ok,
      detail: health.docker?.detail ?? "Docker health reported by worker-runner"
    }),
    (error) => ({
      ok: false,
      detail: error instanceof Error ? error.message : "Docker health unavailable"
    })
  );
}

export async function getSandboxRunnerStatus(): Promise<SandboxRunnerStatus> {
  const native = await invokeGetSandboxRunnerStatus();
  if (native) return native;

  const reachable = await checkRunnerHealth()
    .then((health) => health.ok)
    .catch(() => false);

  return {
    running: reachable,
    managed: false,
    pid: null,
    url: RUNNER_URL,
    detail: reachable ? "worker-runner is reachable on localhost:4317" : "worker-runner is not running"
  };
}

export async function startSandboxRunner(): Promise<SandboxRunnerStatus> {
  const native = await invokeStartSandboxRunner();
  if (native) return native;

  return getSandboxRunnerStatus();
}

export async function stopSandboxRunner(): Promise<SandboxRunnerStatus> {
  const native = await invokeStopSandboxRunner();
  if (native) return native;

  return getSandboxRunnerStatus();
}

export async function checkRunnerHealth(): Promise<{
  ok: boolean;
  docker?: { ok: boolean; detail: string };
  service: string;
}> {
  const response = await fetch(`${RUNNER_URL}/health`);
  return response.json();
}

export async function executeDemoSandboxJob(): Promise<SandboxJob> {
  const response = await fetch(`${RUNNER_URL}/jobs/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(demoPayload)
  });

  if (!response.ok) {
    throw new Error(`Job submit failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { job: SandboxJob };
  return data.job;
}

export async function getSandboxJob(jobId: string): Promise<SandboxJob> {
  const response = await fetch(`${RUNNER_URL}/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error(`Job lookup failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { job: SandboxJob };
  return data.job;
}

export async function cancelSandboxJob(jobId: string): Promise<SandboxJob> {
  const response = await fetch(`${RUNNER_URL}/jobs/${jobId}/cancel`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error(`Cancel failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { job: SandboxJob };
  return data.job;
}
