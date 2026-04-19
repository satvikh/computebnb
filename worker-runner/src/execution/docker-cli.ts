import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { RunnerConfig } from "../config.js";
import type { ExecutionEvents, ExecutionResult, NormalizedJob } from "../types.js";
import { childPath, ensureDir, removeDir } from "../utils/fs.js";
import { LogBuffer } from "../utils/log-buffer.js";
import type { SandboxExecutor } from "./sandbox-executor.js";

interface RunningContainer {
  containerId?: string;
  cancel: () => Promise<void>;
}

export class DockerCliExecutor implements SandboxExecutor {
  private readonly running = new Map<string, RunningContainer>();

  constructor(private readonly config: RunnerConfig) {}

  async execute(job: NormalizedJob, events: ExecutionEvents): Promise<ExecutionResult> {
    const started = Date.now();
    const startTime = new Date(started).toISOString();
    const stdout = new LogBuffer(job.limits.logLimitBytes);
    const stderr = new LogBuffer(job.limits.logLimitBytes);
    const workspace = childPath(this.config.workspaceRoot, job.id);
    const artifactDir = childPath(this.config.artifactRoot, job.id);
    const containerName = `${this.config.containerLabelPrefix}.${job.id}`;
    let containerId: string | undefined;
    let timeoutHit = false;

    await ensureDir(workspace);
    await ensureDir(artifactDir);
    await this.writeWorkspace(job, workspace);

    const running: RunningContainer = {
      cancel: async () => {
        if (containerId) {
          await this.docker(["kill", containerId], { allowFailure: true });
        }
      }
    };
    this.running.set(job.id, running);

    const timeout = setTimeout(() => {
      timeoutHit = true;
      void running.cancel().catch((error) => {
        events.onStderr(`Failed to kill timed out container: ${String(error)}\n`);
      });
    }, job.limits.timeoutMs);

    try {
      events.onState("pulling_image");
      await this.ensureImage(job.image);

      events.onState("running");
      containerId = (
        await this.docker([
          "create",
          "--name",
          containerName,
          "--label",
          `${this.config.containerLabelPrefix}=true`,
          "--label",
          `${this.config.containerLabelPrefix}.job_id=${job.id}`,
          "--network",
          "none",
          "--cap-drop",
          "ALL",
          "--security-opt",
          "no-new-privileges",
          "--user",
          "1000:1000",
          "--cpus",
          String(job.limits.cpus),
          "--memory",
          `${job.limits.memoryMb}m`,
          "--pids-limit",
          String(job.limits.pidsLimit),
          "--read-only",
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,size=64m",
          "--mount",
          `type=bind,source=${workspace},target=/workspace,readonly=false`,
          "--workdir",
          "/workspace",
          job.image,
          ...job.command
        ])
      ).trim();
      running.containerId = containerId;

      await this.docker(["start", containerId]);
      const logPromise = this.followLogs(containerId, {
        onStdout: (chunk) => {
          stdout.append(chunk);
          events.onStdout(chunk);
        },
        onStderr: (chunk) => {
          stderr.append(chunk);
          events.onStderr(chunk);
        }
      });

      const exitCode = Number.parseInt((await this.docker(["wait", containerId])).trim(), 10);
      await logPromise.catch(() => undefined);
      await this.copyArtifacts(workspace, artifactDir);

      return this.result({
        started,
        startTime,
        stdout,
        stderr,
        exitCode,
        artifactDir,
        error: timeoutHit ? "Timed out" : exitCode === 0 ? undefined : `Container exited with code ${exitCode}`
      });
    } catch (error) {
      return this.result({
        started,
        startTime,
        stdout,
        stderr,
        exitCode: null,
        artifactDir,
        error: timeoutHit ? "Timed out" : error instanceof Error ? error.message : String(error)
      });
    } finally {
      clearTimeout(timeout);
      this.running.delete(job.id);
      if (containerId) {
        await this.docker(["rm", "-f", containerId], { allowFailure: true }).catch(() => undefined);
      }
      await removeDir(workspace).catch(() => undefined);
    }
  }

  async cancel(jobId: string) {
    const running = this.running.get(jobId);
    if (!running) return;
    await running.cancel();
  }

  async cleanupOrphans() {
    const activeContainerIds = new Set(
      [...this.running.values()].map((container) => container.containerId).filter((id): id is string => Boolean(id))
    );
    const label = `${this.config.containerLabelPrefix}=true`;
    const containers = (await this.docker(["ps", "-aq", "--filter", `label=${label}`], { allowFailure: true }))
      .split("\n")
      .map((line) => line.trim())
      .filter((id) => id && !activeContainerIds.has(id));

    await Promise.all(containers.map((id) => this.docker(["rm", "-f", id], { allowFailure: true })));
  }

  async health() {
    try {
      const detail = (await this.docker(["version", "--format", "{{.Server.Version}}"])).trim();
      return { ok: true, detail: `Docker daemon available (${detail})` };
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : String(error) };
    }
  }

  private async writeWorkspace(job: NormalizedJob, workspace: string) {
    await fs.writeFile(path.join(workspace, "input.json"), JSON.stringify(job.input ?? {}, null, 2));
    await ensureDir(path.join(workspace, "artifacts"));

    if (job.script) {
      await fs.writeFile(path.join(workspace, "job.py"), job.script, { mode: 0o644 });
    }

    // The container runs as uid 1000 while the host directory is created by the
    // local user. For the MVP, make only this isolated workspace writable.
    await fs.chmod(workspace, 0o777);
    await fs.chmod(path.join(workspace, "artifacts"), 0o777);
  }

  private async copyArtifacts(workspace: string, artifactDir: string) {
    const source = path.join(workspace, "artifacts");
    try {
      const entries = await fs.readdir(source);
      await Promise.all(
        entries.map((entry) =>
          fs.cp(path.join(source, entry), path.join(artifactDir, entry), {
            recursive: true,
            force: true
          })
        )
      );
    } catch {
      // Jobs are allowed to produce no artifacts.
    }
  }

  private result(args: {
    started: number;
    startTime: string;
    stdout: LogBuffer;
    stderr: LogBuffer;
    exitCode: number | null;
    artifactDir: string;
    error?: string;
  }): ExecutionResult {
    const ended = Date.now();
    return {
      exitCode: args.exitCode,
      startTime: args.startTime,
      endTime: new Date(ended).toISOString(),
      durationMs: ended - args.started,
      logs: {
        stdout: args.stdout.toString(),
        stderr: args.stderr.toString(),
        truncated: args.stdout.truncated || args.stderr.truncated
      },
      artifactPaths: [args.artifactDir],
      error: args.error
    };
  }

  private docker(args: string[], options: { allowFailure?: boolean } = {}) {
    return new Promise<string>((resolve, reject) => {
      const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        reject(new Error(`Docker command failed to start. Is Docker installed and running? ${error.message}`));
      });
      child.on("close", (code) => {
        if (code === 0 || options.allowFailure) {
          resolve(stdout);
          return;
        }
        reject(new Error(`docker ${args.join(" ")} failed (${code}): ${stderr || stdout}`.trim()));
      });
    });
  }

  private async ensureImage(image: string) {
    try {
      await this.docker(["image", "inspect", image]);
      return;
    } catch {
      await this.docker(["pull", image]);
    }
  }

  private followLogs(
    containerId: string,
    handlers: {
      onStdout(chunk: string): void;
      onStderr(chunk: string): void;
    }
  ) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn("docker", ["logs", "-f", containerId], { stdio: ["ignore", "pipe", "pipe"] });

      child.stdout.on("data", (chunk: Buffer) => handlers.onStdout(chunk.toString()));
      child.stderr.on("data", (chunk: Buffer) => handlers.onStderr(chunk.toString()));
      child.on("error", reject);
      child.on("close", () => resolve());
    });
  }
}
