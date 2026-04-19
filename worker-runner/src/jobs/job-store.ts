import type { ExecutionResult, JobRecord, JobState } from "../types.js";
import { LogBuffer } from "../utils/log-buffer.js";

export class JobStore {
  private readonly jobs = new Map<string, JobRecord>();
  private readonly liveLogs = new Map<string, { stdout: LogBuffer; stderr: LogBuffer }>();

  create(record: JobRecord, logLimitBytes: number) {
    this.jobs.set(record.id, record);
    this.liveLogs.set(record.id, {
      stdout: new LogBuffer(logLimitBytes),
      stderr: new LogBuffer(logLimitBytes)
    });
    return record;
  }

  get(id: string) {
    return this.jobs.get(id);
  }

  updateState(id: string, state: JobState) {
    const job = this.mustGet(id);
    job.state = state;
    job.updatedAt = new Date().toISOString();
    return job;
  }

  complete(id: string, result: ExecutionResult) {
    const job = this.mustGet(id);
    job.state = result.error === "Timed out" ? "timed_out" : result.exitCode === 0 ? "completed" : "failed";
    job.result = result;
    job.logs = result.logs;
    job.error = result.error;
    job.updatedAt = new Date().toISOString();
    this.liveLogs.delete(id);
    return job;
  }

  fail(id: string, error: string) {
    const job = this.mustGet(id);
    job.state = "failed";
    job.error = error;
    job.updatedAt = new Date().toISOString();
    this.liveLogs.delete(id);
    return job;
  }

  appendStdout(id: string, chunk: string) {
    const job = this.mustGet(id);
    const logs = this.liveLogs.get(id);
    if (!logs) return;
    logs.stdout.append(chunk);
    job.logs = {
      stdout: logs.stdout.toString(),
      stderr: logs.stderr.toString(),
      truncated: logs.stdout.truncated || logs.stderr.truncated
    };
    job.updatedAt = new Date().toISOString();
  }

  appendStderr(id: string, chunk: string) {
    const job = this.mustGet(id);
    const logs = this.liveLogs.get(id);
    if (!logs) return;
    logs.stderr.append(chunk);
    job.logs = {
      stdout: logs.stdout.toString(),
      stderr: logs.stderr.toString(),
      truncated: logs.stdout.truncated || logs.stderr.truncated
    };
    job.updatedAt = new Date().toISOString();
  }

  listActiveIds() {
    return [...this.jobs.values()]
      .filter((job) => job.state === "queued" || job.state === "pulling_image" || job.state === "running")
      .map((job) => job.id);
  }

  private mustGet(id: string) {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Unknown job ${id}`);
    return job;
  }
}
