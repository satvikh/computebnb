import type { RunnerConfig } from "../config.js";
import type { SandboxExecutor } from "./sandbox-executor.js";

export class CleanupManager {
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly executor: SandboxExecutor,
    private readonly config: RunnerConfig
  ) {}

  start() {
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), this.config.orphanCleanupIntervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce() {
    try {
      await this.executor.cleanupOrphans();
    } catch (error) {
      console.warn("[cleanup] failed to remove orphaned containers", error);
    }
  }
}
