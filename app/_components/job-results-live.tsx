"use client";

import * as React from "react";
import { StatusPill } from "@/app/_components/chrome";

type JobEventView = {
  id: string;
  jobId: string;
  providerId: string | null;
  providerName: string | null;
  type: string;
  message: string;
  createdAt: string | null;
};

type JobView = {
  id: string;
  title: string;
  type: string;
  status: string;
  machineId: string;
  machineName: string | null;
  source: string;
  input: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  result: string | null;
  error: string | null;
  failureReason: string | null;
  budgetCents: number;
  jobCostCents: number | null;
  providerPayoutCents: number | null;
  platformFeeCents: number | null;
  assignedProviderName: string | null;
  actualRuntimeSeconds: number | null;
  retryCount: number;
  proofHash: string | null;
};

type JobResultsLiveProps = {
  initialJob: JobView;
  initialEvents: JobEventView[];
};

function centsToDollars(cents: number | null) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents ?? 0) / 100);
}

function formatRuntime(seconds: number | null) {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function statusToPill(status: string): "live" | "running" | "warming" | "error" | "idle" {
  if (status === "completed") return "live";
  if (status === "running") return "running";
  if (status === "assigned") return "warming";
  if (status === "failed") return "error";
  return "idle";
}

function decodeStreams(job: JobView) {
  let stdout = job.stdout || job.result || "";
  let stderr = job.stderr || job.error || job.failureReason || "";
  let exitCode: number | null = job.exitCode ?? (job.status === "completed" ? 0 : job.status === "failed" ? 1 : null);

  if (job.result) {
    try {
      const parsed = JSON.parse(job.result) as Record<string, unknown>;
      if (typeof parsed.stdout === "string") stdout = parsed.stdout;
      if (typeof parsed.output === "string") stdout = parsed.output;
      if (typeof parsed.stderr === "string") stderr = parsed.stderr;
      if (typeof parsed.exitCode === "number") exitCode = parsed.exitCode;
    } catch {
      // Keep fallback mapping when result is plain text.
    }
  }

  return {
    stdout: stdout || "Waiting for worker output.",
    stderr: stderr || "—",
    exitCode
  };
}

export function JobResultsLive({ initialJob, initialEvents }: JobResultsLiveProps) {
  const [job, setJob] = React.useState(initialJob);
  const [events, setEvents] = React.useState(initialEvents);
  const [pollError, setPollError] = React.useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(`/api/jobs/${job.id}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Refresh failed (${response.status})`);
        }
        const data = (await response.json()) as { job: JobView; events: JobEventView[] };
        if (cancelled) return;
        setJob(data.job);
        setEvents(data.events);
        setLastUpdatedAt(new Date().toISOString());
        setPollError(null);
      } catch (error) {
        if (cancelled) return;
        setPollError(error instanceof Error ? error.message : "Refresh failed");
      }
    }

    void refresh();
    if (job.status === "completed" || job.status === "failed") {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [job.id, job.status]);

  const streams = decodeStreams(job);
  const sourceHeader = job.source.split("\n")[0] ?? "";
  const fileNameMatch = sourceHeader.match(/^# file:\s*(.+)$/);
  const sourceMode = fileNameMatch ? "upload" : "editor";
  const fileName = fileNameMatch?.[1] ?? "inline.py";

  return (
    <>
      <div style={{ padding: "24px", borderBottom: "1px solid var(--rule-soft)", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>§ Step 04 · Runtime view</div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontSize: 52, fontWeight: 500, letterSpacing: -2, lineHeight: 0.94, margin: 0 }}>{job.title}</h1>
          <div className="mono" style={{ marginTop: 10, fontSize: 11, color: "var(--ink-3)" }}>
            {job.id} · target {job.machineName ?? "scheduler"} · assigned {job.assignedProviderName ?? "pending"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 10, color: pollError ? "var(--error)" : "var(--ink-3)" }}>
            {pollError ? pollError : `live ${lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : "syncing"}`}
          </span>
          <StatusPill state={statusToPill(job.status)}>{job.status}</StatusPill>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <section style={{ padding: "24px", borderRight: "1px solid var(--rule-soft)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Python input</div>
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13, minHeight: 220 }}>
            {job.source || job.input}
          </div>
        </section>
        <section style={{ padding: "24px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>stdout</div>
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13, minHeight: 220 }}>
            {streams.stdout}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 0, borderTop: "1px solid var(--rule-soft)" }}>
        <section style={{ padding: "24px", borderRight: "1px solid var(--rule-soft)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>stderr + exit</div>
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13, minHeight: 132, color: streams.stderr === "—" ? "var(--ink-3)" : "var(--error)" }}>
            {streams.stderr}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 14 }}>
            <Panel label="Exit code" value={streams.exitCode === null ? "running" : String(streams.exitCode)} />
            <Panel label="Runtime" value={formatRuntime(job.actualRuntimeSeconds)} />
            <Panel label="Budget cap" value={centsToDollars(job.budgetCents)} />
            <Panel label="Final cost" value={centsToDollars(job.jobCostCents)} />
            <Panel label="Proof hash" value={job.proofHash ?? "pending"} />
            <Panel label="Payout" value={centsToDollars(job.providerPayoutCents)} />
            <Panel label="Platform fee" value={centsToDollars(job.platformFeeCents)} />
            <Panel label="Retries" value={String(job.retryCount)} />
            <Panel label="Source" value={sourceMode} />
            <Panel label="File name" value={fileName} />
          </div>
        </section>

        <section style={{ padding: "24px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Event trail</div>
          <div style={{ display: "grid", maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
            {events.map((event) => (
              <div key={event.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 12, padding: "10px 0", borderBottom: "1px dashed var(--rule-soft)" }}>
                <span className="mono" style={{ color: "var(--ink-3)", fontSize: 10 }}>
                  {event.createdAt ? new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
                <span>
                  <div style={{ fontSize: 13 }}>{event.message}</div>
                  <div className="mono" style={{ marginTop: 4, fontSize: 10, color: "var(--ink-4)" }}>
                    {event.type} · {event.providerName ?? event.providerId ?? "marketplace"}
                  </div>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Panel({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 14 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: 19, fontWeight: 500, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}
