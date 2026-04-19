import type { RunnerConfig } from "../config.js";
import type { Executor, JobRequest, JobRecord, NormalizedJob } from "../types.js";
import { JobStore } from "./job-store.js";
import { normalizeJob, toJobRecord } from "./registry.js";

export class RunnerService {
  private readonly active = new Set<string>();

  constructor(
    private readonly config: RunnerConfig,
    private readonly executor: Executor,
    private readonly store: JobStore
  ) {}

  submit(request: JobRequest): JobRecord {
    const job = normalizeJob(request, {
      timeoutMs: this.config.defaultTimeoutMs,
      logLimitBytes: this.config.maxLogBytes
    });
    const record = this.store.create(toJobRecord(job), job.limits.logLimitBytes);

    void this.run(job).catch((error) => {
      this.store.fail(job.id, error instanceof Error ? error.message : String(error));
    });

    return record;
  }

  get(id: string) {
    return this.store.get(id);
  }

  async cancel(id: string) {
    const job = this.store.get(id);
    if (!job) return undefined;
    await this.executor.cancel(id);
    return this.store.get(id);
  }

  private async run(job: NormalizedJob) {
    if (this.active.has(job.id)) {
      throw new Error(`Job ${job.id} is already running`);
    }

    this.active.add(job.id);
    try {
      const result = await this.executor.execute(job, {
        onState: (state) => this.store.updateState(job.id, state),
        onStdout: (chunk) => {
          process.stdout.write(`[${job.id}] ${chunk}`);
          this.store.appendStdout(job.id, chunk);
        },
        onStderr: (chunk) => {
          process.stderr.write(`[${job.id}] ${chunk}`);
          this.store.appendStderr(job.id, chunk);
        }
      });
      this.store.complete(job.id, result);
    } finally {
      this.active.delete(job.id);
    }
  }
}
