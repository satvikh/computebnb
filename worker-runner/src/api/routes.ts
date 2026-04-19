import type { Express } from "express";
import { Router } from "express";
import { ZodError } from "zod";
import type { Executor } from "../types.js";
import { parseJobRequest } from "../jobs/registry.js";
import type { RunnerService } from "../jobs/runner-service.js";

export function installRoutes(app: Express, service: RunnerService, executor: Executor) {
  const router = Router();

  router.get("/health", async (_request, response) => {
    const docker = await executor.health();
    response.status(docker.ok ? 200 : 503).json({
      ok: docker.ok,
      docker,
      service: "worker-runner"
    });
  });

  router.post("/jobs/execute", (request, response) => {
    try {
      const job = service.submit(parseJobRequest(request.body));
      response.status(202).json({ job });
    } catch (error) {
      const status = error instanceof ZodError ? 400 : 422;
      response.status(status).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.post("/jobs/execute-sync", async (request, response) => {
    try {
      const job = await service.executeSync(parseJobRequest(request.body));
      response.status(200).json({ job });
    } catch (error) {
      const status = error instanceof ZodError ? 400 : 422;
      response.status(status).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.get("/jobs/:id", (request, response) => {
    const job = service.get(request.params.id);
    if (!job) {
      response.status(404).json({ error: "Job not found" });
      return;
    }
    response.json({ job });
  });

  router.post("/jobs/:id/cancel", async (request, response) => {
    const job = await service.cancel(request.params.id);
    if (!job) {
      response.status(404).json({ error: "Job not found" });
      return;
    }
    response.json({ job });
  });

  app.use(router);
}
