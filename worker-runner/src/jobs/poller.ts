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
  private remoteJobId: string | undefined;
  private providerId: string | undefined;
  private providerToken: string | undefined;

  constructor(
    private readonly config: RunnerConfig,
    private readonly service: RunnerService
  ) {
    this.providerId = config.providerId;
    this.providerToken = config.providerToken;
  }

  start() {
    if (!this.config.pollEnabled) {
      console.log("[poller] disabled. Use POST /jobs/execute for local demo jobs.");
      return;
    }

    void this.bootstrap().then(() => this.tick()).catch((error) => {
      console.warn("[poller] bootstrap failed", error instanceof Error ? error.message : error);
    });
    this.timer = setInterval(() => void this.tick(), this.config.pollIntervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.busy || this.remoteJobId) return;
    this.busy = true;

    try {
      await this.bootstrap();
      if (!this.providerId) return;

      const response = await this.post<RemotePollResponse>("/api/worker/poll", {
        providerId: this.providerId
      });

      if (!response.job) return;

      const payload = this.toLocalJob(response.job);
      await this.post(`/api/jobs/${response.job.id}/start`, {
        providerId: this.providerId
      });
      const submitted = this.service.submit(payload, {
        onComplete: async (job) => {
          try {
            await this.reportRemoteResult(response.job!.id, job);
          } finally {
            this.remoteJobId = undefined;
          }
        }
      });
      this.remoteJobId = response.job.id;
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
        ...(this.providerToken ? { authorization: `Bearer ${this.providerToken}` } : {})
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`${path} returned ${response.status}: ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  private async bootstrap() {
    if (this.providerId && this.providerToken) return;

    if (this.providerId && !this.providerToken) {
      console.warn("[poller] PROVIDER_ID is set but PROVIDER_TOKEN is missing; remote polling requires a token.");
      return;
    }

    const response = await fetch(`${this.config.apiBaseUrl}/api/providers/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: process.env.PROVIDER_NAME || "Local Docker Provider",
        capabilities: ["cpu", "docker"],
        hourlyRateCents: 250
      })
    });

    if (!response.ok) {
      throw new Error(`/api/providers/register returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as {
      provider?: { id?: string; token?: string; name?: string };
    };

    if (!body.provider?.id || !body.provider?.token) {
      throw new Error("Provider registration did not return an id and token.");
    }

    this.providerId = body.provider.id;
    this.providerToken = body.provider.token;
    console.log(`[poller] registered provider ${body.provider.name ?? this.providerId} (${this.providerId})`);
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

  private async reportRemoteResult(remoteJobId: string, job: { state: string; result?: unknown; error?: string }) {
    if (job.state === "completed") {
      await this.post(`/api/jobs/${remoteJobId}/complete`, {
        providerId: this.providerId,
        result: JSON.stringify(job.result ?? {}, null, 2),
        message: "Docker worker-runner completed execution"
      });
      return;
    }

    await this.post(`/api/jobs/${remoteJobId}/fail`, {
      providerId: this.providerId,
      error: job.error ?? `Runner ended in ${job.state}`,
      message: "Docker worker-runner failed execution"
    });
  }
}
