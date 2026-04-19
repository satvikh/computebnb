import { loadConfig } from "./config.js";
import { createServer } from "./api/server.js";
import { DockerCliExecutor } from "./execution/docker-cli.js";
import { CleanupManager } from "./execution/cleanup-manager.js";
import { JobStore } from "./jobs/job-store.js";
import { JobPoller } from "./jobs/poller.js";
import { RunnerService } from "./jobs/runner-service.js";
import { ensureDir } from "./utils/fs.js";

async function main() {
  const config = loadConfig();
  await ensureDir(config.workspaceRoot);
  await ensureDir(config.artifactRoot);

  const executor = new DockerCliExecutor(config);
  const store = new JobStore();
  const service = new RunnerService(config, executor, store);
  const cleanup = new CleanupManager(executor, config);
  const poller = new JobPoller(config, service);
  const server = createServer(config, service, executor).listen();

  cleanup.start();
  poller.start();

  const shutdown = async () => {
    console.log("[worker-runner] shutting down");
    poller.stop();
    cleanup.stop();
    server.close();
    await Promise.all(store.listActiveIds().map((id) => executor.cancel(id)));
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((error) => {
  console.error("[worker-runner] fatal", error);
  process.exit(1);
});
