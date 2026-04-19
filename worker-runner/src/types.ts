export type JobType = "python_script" | "inference" | "benchmark_demo";

export type JobState =
  | "queued"
  | "pulling_image"
  | "running"
  | "completed"
  | "failed"
  | "timed_out";

export interface JobLimits {
  timeoutMs: number;
  cpus: number;
  memoryMb: number;
  pidsLimit: number;
  logLimitBytes: number;
}

export interface JobRequest {
  id?: string;
  type: JobType;
  image?: string;
  command?: string[];
  script?: string;
  input?: Record<string, unknown>;
  limits?: Partial<JobLimits>;
}

export interface ExecutionResult {
  exitCode: number | null;
  startTime: string;
  endTime: string;
  durationMs: number;
  logs: {
    stdout: string;
    stderr: string;
    truncated: boolean;
  };
  artifactPaths: string[];
  error?: string;
}

export interface JobRecord {
  id: string;
  type: JobType;
  state: JobState;
  image: string;
  command: string[];
  createdAt: string;
  updatedAt: string;
  logs: {
    stdout: string;
    stderr: string;
    truncated: boolean;
  };
  result?: ExecutionResult;
  error?: string;
}

export interface Executor {
  execute(job: NormalizedJob, events: ExecutionEvents): Promise<ExecutionResult>;
  cancel(jobId: string): Promise<void>;
  cleanupOrphans(): Promise<void>;
  health(): Promise<{ ok: boolean; detail: string }>;
}

export interface NormalizedJob {
  id: string;
  type: JobType;
  image: string;
  command: string[];
  script?: string;
  input?: Record<string, unknown>;
  limits: JobLimits;
}

export interface ExecutionEvents {
  onState(state: JobState): void;
  onStdout(chunk: string): void;
  onStderr(chunk: string): void;
}
