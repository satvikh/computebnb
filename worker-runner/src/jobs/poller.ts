import type { RunnerConfig } from "../config.js";
import type { JobRequest } from "../types.js";
import type { RunnerService } from "./runner-service.js";

interface RemotePollResponse {
  assignment: { id: string; jobId: string } | null;
  job: {
    id: string;
    type?: string;
    input?: string | Record<string, unknown>;
    runnerPayload?: JobRequest;
  } | null;
}

export class JobPoller {
  private timer: NodeJS.Timeout | undefined;
  private busy = false;

  constructor(
    private readonly config: RunnerConfig,
    private readonly service: RunnerService
  ) {}

  start() {
    if (!this.config.pollEnabled) {
      console.log("[poller] disabled. Use POST /jobs/execute for local demo jobs.");
      return;
    }

    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.config.pollIntervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.busy) return;
    this.busy = true;

    try {
      const response = await this.post<RemotePollResponse>("/api/worker/poll", {
        providerId: this.config.providerId
      });

      if (!response.job) return;

      const payload = this.toLocalJob(response.job);
      const submitted = this.service.submit(payload);
      console.log(`[poller] accepted remote job ${response.job.id} as ${submitted.id}`);
    } catch (error) {
      console.warn("[poller] failed", error instanceof Error ? error.message : error);
    } finally {
      this.busy = false;
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.config.providerToken ? { authorization: `Bearer ${this.config.providerToken}` } : {})
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`${path} returned ${response.status}: ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  private toLocalJob(job: NonNullable<RemotePollResponse["job"]>): JobRequest {
    if (job.runnerPayload) {
      return { id: job.id, ...job.runnerPayload };
    }

    // Compatibility shim for the existing ComputeBNB mock jobs, which currently
    // store a free-form input string rather than a sandbox-specific payload.
    const input = typeof job.input === "string" ? { text: job.input } : job.input;
    return {
      id: job.id,
      type: "benchmark_demo",
      input: input ?? { source: "remote-poll" }
    };
  }
}
