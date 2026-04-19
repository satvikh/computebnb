"use client";

import * as React from "react";
import { Box, CircleStop, Play, RefreshCw, Terminal, Zap } from "lucide-react";
import {
  cancelSandboxJob,
  checkDockerHealth,
  executeDemoSandboxJob,
  getSandboxJob,
  getSandboxRunnerStatus,
  startSandboxRunner,
  stopSandboxRunner,
  type SandboxJob
} from "@/src/lib/sandbox-runner-client";
import type { DockerHealth, SandboxRunnerStatus } from "@/src/types/worker";

function isFinal(state?: SandboxJob["state"]) {
  return state === "completed" || state === "failed" || state === "timed_out";
}

export function SandboxRunnerPanel() {
  const [docker, setDocker] = React.useState<DockerHealth | null>(null);
  const [runner, setRunner] = React.useState<SandboxRunnerStatus | null>(null);
  const [job, setJob] = React.useState<SandboxJob | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [terminal, setTerminal] = React.useState<Array<{ at: string; level: "info" | "success" | "error"; message: string }>>([]);

  function writeLog(level: "info" | "success" | "error", message: string) {
    setTerminal((items) => [{ at: new Date().toISOString(), level, message }, ...items].slice(0, 10));
  }

  const refresh = React.useCallback(async () => {
    setError(null);
    writeLog("info", "Checking Docker and sandbox runner status.");
    const [dockerHealth, runnerStatus] = await Promise.all([checkDockerHealth(), getSandboxRunnerStatus()]);
    setDocker(dockerHealth);
    setRunner(runnerStatus);
    writeLog(
      dockerHealth.ok && runnerStatus.running ? "success" : "info",
      `Docker is ${dockerHealth.ok ? "ready" : "not available"}; runner is ${runnerStatus.running ? "running" : "stopped"}.`
    );
  }, []);

  React.useEffect(() => {
    refresh().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to refresh sandbox status."));
  }, [refresh]);

  React.useEffect(() => {
    if (!job || isFinal(job.state)) return;

    const timer = window.setInterval(() => {
      getSandboxJob(job.id)
        .then(setJob)
        .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to refresh sandbox job."));
    }, 650);

    return () => window.clearInterval(timer);
  }, [job]);

  async function withBusy(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await action();
      writeLog("success", `${label} completed successfully.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Sandbox action failed.";
      setError(message);
      writeLog("error", `${label} failed: ${message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-100">
            <Box className="h-4 w-4" />
            <p className="text-sm font-semibold">Docker sandbox</p>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Run the approved Python demo in the same ephemeral Docker worker used by provider jobs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void withBusy("refresh", refresh)}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() =>
              void withBusy("start", async () => {
                setRunner(await startSandboxRunner());
                await refresh();
              })
            }
            className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200"
          >
            <Play className="h-4 w-4" />
            Start runner
          </button>
          <button
            onClick={() =>
              void withBusy("stop", async () => {
                setRunner(await stopSandboxRunner());
                await refresh();
              })
            }
            className="inline-flex items-center gap-2 rounded-md border border-rose-300/30 px-3 py-2 text-sm text-rose-100 transition hover:bg-rose-300/10"
          >
            <CircleStop className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatusTile label="Docker" value={docker?.ok ? "Ready" : "Unavailable"} detail={docker?.detail ?? "Checking Docker daemon."} ok={docker?.ok} />
        <StatusTile label="Runner" value={runner?.running ? "Running" : "Stopped"} detail={runner?.detail ?? "Checking worker-runner."} ok={runner?.running} />
        <StatusTile label="Mode" value={runner?.managed ? "App-managed" : "External"} detail={runner?.pid ? `pid ${runner.pid}` : "Manual runner is fine for local demos."} ok={runner?.running} />
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">{error}</div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          disabled={Boolean(busy) || !runner?.running}
          onClick={() =>
            void withBusy("demo", async () => {
              const submitted = await executeDemoSandboxJob();
              setJob(submitted);
            })
          }
          className="inline-flex items-center gap-2 rounded-md bg-cyan-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          Run demo job
        </button>
        <button
          disabled={!job || isFinal(job.state)}
          onClick={() =>
            job
              ? void withBusy("cancel", async () => {
                  setJob(await cancelSandboxJob(job.id));
                })
              : undefined
          }
          className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel job
        </button>
        {busy ? <span className="self-center text-sm text-zinc-500">Working on {busy}...</span> : null}
      </div>

      {job ? (
        <div className="mt-5 rounded-md border border-white/10 bg-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-mono text-xs uppercase text-zinc-500">{job.id}</p>
              <p className="mt-1 text-sm font-semibold text-white">{job.type.replace("_", " ")} · {job.state}</p>
            </div>
            <p className="text-xs text-zinc-500">{job.image}</p>
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            <LogPane title="stdout" value={job.result?.logs.stdout ?? job.logs.stdout} />
            <LogPane title="stderr" value={job.result?.logs.stderr ?? job.logs.stderr} />
          </div>
          {job.result?.artifactPaths.length ? (
            <div className="border-t border-white/10 px-4 py-3 text-xs text-zinc-400">
              Artifact path: <span className="font-mono text-zinc-200">{job.result.artifactPaths[0]}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-md border border-white/10 bg-black/30 p-3">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Terminal log</p>
        <div className="space-y-1 font-mono text-xs">
          {terminal.map((item, index) => (
            <div key={`${item.at}-${index}`} className={item.level === "error" ? "text-rose-200" : item.level === "success" ? "text-emerald-200" : "text-zinc-300"}>
              {new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} - {item.message}
            </div>
          ))}
          {!terminal.length ? <div className="text-zinc-500">No sandbox actions yet.</div> : null}
        </div>
      </div>
    </section>
  );
}

function StatusTile({ label, value, detail, ok }: { label: string; value: string; detail: string; ok?: boolean }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={ok ? "h-2 w-2 rounded-full bg-emerald-300" : "h-2 w-2 rounded-full bg-zinc-600"} />
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

function LogPane({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-h-40 border-t border-white/10 p-4 md:border-r md:border-t-0">
      <div className="mb-2 flex items-center gap-2 text-zinc-500">
        <Terminal className="h-3.5 w-3.5" />
        <p className="font-mono text-[11px] uppercase tracking-[0.2em]">{title}</p>
      </div>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-zinc-200">
        {value || "waiting for output..."}
      </pre>
    </div>
  );
}
