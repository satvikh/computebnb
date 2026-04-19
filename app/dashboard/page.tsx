import Link from "next/link";
import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { MachineGrid, StatusPill } from "@/app/_components/chrome";
import { getDashboardSummary } from "@/lib/marketplace";
import { isDbConfigured } from "@/lib/db";

function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function statusToPill(status: string): "live" | "running" | "warming" | "error" | "idle" {
  if (status === "completed") return "live";
  if (status === "running") return "running";
  if (status === "assigned") return "warming";
  if (status === "failed") return "error";
  return "idle";
}

function parseOutput(job: {
  stdout?: string | null;
  stderr?: string | null;
  result: string | null;
  error: string | null;
  failureReason: string | null;
  exitCode?: number | null;
  status: string;
}) {
  let stdout = job.stdout ?? job.result ?? "";
  let stderr = job.stderr ?? job.error ?? job.failureReason ?? "";
  let exitCode: number | null = job.exitCode ?? (job.status === "completed" ? 0 : job.status === "failed" ? 1 : null);

  if (job.result) {
    try {
      const parsed = JSON.parse(job.result) as Record<string, unknown>;
      if (typeof parsed.output === "string") stdout = parsed.output;
      if (typeof parsed.stdout === "string") stdout = parsed.stdout;
      if (typeof parsed.stderr === "string") stderr = parsed.stderr;
      if (typeof parsed.exitCode === "number") exitCode = parsed.exitCode;
    } catch {
      // Keep plain text fallback for current worker payloads.
    }
  }

  return {
    stdout: stdout || "Waiting for output.",
    stderr: stderr || "—",
    exitCode
  };
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let summary: Awaited<ReturnType<typeof getDashboardSummary>> | null = null;
  let dbError = false;

  try {
    if (isDbConfigured()) {
      summary = await getDashboardSummary();
    }
  } catch {
    dbError = true;
  }

  const providers = summary?.providers ?? [];
  const recentJobs = summary?.recentJobs ?? [];
  const runningJobs = recentJobs.filter((job) => ["queued", "assigned", "running"].includes(job.status));
  const latestJob = recentJobs[0] ?? null;
  const latestStreams = latestJob ? parseOutput(latestJob) : null;
  const firstMachineId = providers[0]?.id;

  return (
    <MarketplaceShell
      page="dashboard"
      rightRail={
        <>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            <span className="dot live animated" style={{ marginRight: 6 }} />
            {providers.length} machines listed
          </span>
          <span style={{ width: 1, height: 18, background: "var(--rule-soft)" }} />
          <span className="mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>
            jobs
          </span>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500 }}>
            {recentJobs.length}
          </span>
        </>
      }
    >
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--rule-soft)", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", alignItems: "end", gap: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            § Consumer flow · MVP
          </div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 32, letterSpacing: -0.64, margin: 0, lineHeight: 1 }}>
            Browse machines.
            <span className="serif" style={{ fontSize: 32, color: "var(--ink-3)" }}> Submit Python. Track runtime.</span>
          </h1>
          <p style={{ margin: "14px 0 0", maxWidth: 760, fontSize: 14, lineHeight: 1.65, color: "var(--ink-3)" }}>
            This dashboard now mirrors the simplified consumer journey end-to-end, while keeping the existing marketplace visual language intact.
          </p>
        </div>
        <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Machine heatmap</div>
          <MachineGrid rows={6} cols={24} seed={providers.length + recentJobs.length + 5} running={0.14} warming={0.08} live={0.4} />
          <div className="mono" style={{ marginTop: 8, fontSize: 10, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
            <span>online {summary?.providerCounts.online ?? 0}</span>
            <span>busy {summary?.providerCounts.busy ?? 0}</span>
            <span>queued {summary?.jobCounts.queued ?? 0}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--rule)" }}>
        <Metric label="ONLINE MACHINES" value={String(summary?.providerCounts.online ?? 0)} detail="eligible to receive jobs" />
        <Metric label="RUNNING JOBS" value={String(summary?.jobCounts.running ?? 0)} detail={`${summary?.jobCounts.assigned ?? 0} assigned`} />
        <Metric label="COMPLETED" value={String(summary?.jobCounts.completed ?? 0)} detail={`${summary?.jobCounts.failed ?? 0} failed`} />
        <Metric label="TOTAL COST" value={centsToDollars(recentJobs.reduce((sum, job) => sum + (job.jobCostCents ?? 0), 0))} detail="recent ledger window" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.02fr 0.94fr 1.04fr", minHeight: 620 }}>
        <section style={{ borderRight: "1px solid var(--rule-soft)", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="eyebrow">Step 1 · Browse machines</div>
            <Link href="/providers" className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Open full list →</Link>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {providers.slice(0, 5).map((provider) => (
              <div key={provider.id} style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 500 }}>{provider.name}</div>
                    <div className="mono" style={{ marginTop: 4, fontSize: 10, color: "var(--ink-3)" }}>
                      {provider.capabilities.join(" · ")}
                    </div>
                  </div>
                  <StatusPill state={provider.status === "online" ? "live" : provider.status === "busy" ? "running" : "idle"}>
                    {provider.status}
                  </StatusPill>
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  <span>{centsToDollars(provider.hourlyRateCents)}/hr · {provider.successRate}% success</span>
                  <Link href={`/jobs/new?machine=${provider.id}`} style={{ padding: "8px 10px", borderRadius: 2, background: "var(--ink)", color: "var(--paper)", fontSize: 11 }}>
                    Choose →
                  </Link>
                </div>
              </div>
            ))}
            {!providers.length && (
              <EmptyState
                title={dbError || !isDbConfigured() ? "MongoDB needed" : "No machines online"}
                copy={dbError || !isDbConfigured()
                  ? "Configure MongoDB, then heartbeat providers to populate the machine catalog."
                  : "Start a provider worker to make at least one machine available for selection."}
              />
            )}
          </div>
        </section>

        <section style={{ borderRight: "1px solid var(--rule-soft)", padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="eyebrow">Step 2 · Submit Python</div>
            <Link href={firstMachineId ? `/jobs/new?machine=${firstMachineId}` : "/jobs/new"} className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Open submit form →</Link>
          </div>
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 10 }}>MVP INPUT CONTRACT</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
{`# raw python or uploaded .py
def run():
    print("hello from selected machine")

if __name__ == "__main__":
    run()`}
            </div>
          </div>
          <div style={{ marginTop: 12, border: "1px dashed var(--rule-soft)", padding: 14, fontSize: 13, lineHeight: 1.7, color: "var(--ink-3)" }}>
            The form keeps mocked auth untouched and creates a machine-scoped <span className="mono">python</span> job using submitted source code.
          </div>
          <Link href={firstMachineId ? `/jobs/new?machine=${firstMachineId}` : "/jobs/new"} style={{ marginTop: "auto", padding: "12px 14px", borderRadius: 2, background: "var(--ink)", color: "var(--paper)", fontSize: 13, fontWeight: 500, textAlign: "center" }}>
            Submit Python job →
          </Link>
        </section>

        <section style={{ padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="eyebrow">Step 3 · Monitor runtime</div>
            <Link href="/jobs" className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Open queue →</Link>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {runningJobs.slice(0, 5).map((job) => {
              const machine = job.machineName ?? job.assignedProviderName ?? "scheduler";
              const streams = parseOutput(job);
              return (
                <Link key={job.id} href={`/jobs/${job.id}/results`} style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 500 }}>{job.title}</div>
                      <div className="mono" style={{ marginTop: 4, fontSize: 10, color: "var(--ink-3)" }}>
                        {machine}
                      </div>
                    </div>
                    <StatusPill state={statusToPill(job.status)}>{job.status}</StatusPill>
                  </div>
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "60px 1fr", gap: 8, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    <span style={{ color: "var(--ink-4)" }}>stdout</span>
                    <span style={{ color: "var(--ink-3)" }}>{streams.stdout.length > 44 ? `${streams.stdout.slice(0, 44)}…` : streams.stdout}</span>
                    <span style={{ color: "var(--ink-4)" }}>stderr</span>
                    <span style={{ color: streams.stderr === "—" ? "var(--ink-3)" : "var(--error)" }}>{streams.stderr}</span>
                    <span style={{ color: "var(--ink-4)" }}>exit</span>
                    <span>{streams.exitCode === null ? "running" : streams.exitCode}</span>
                  </div>
                </Link>
              );
            })}
            {!runningJobs.length && (
              <EmptyState title="No active jobs" copy="Choose a machine and submit Python to watch queue, assignment, running state, and output logs here." />
            )}
          </div>
        </section>
      </div>

      {latestJob && latestStreams && (
        <div style={{ borderTop: "1px solid var(--rule-soft)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <section style={{ padding: "20px 24px", borderRight: "1px solid var(--rule-soft)" }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Latest stdout</div>
            <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 16, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", minHeight: 110 }}>
              {latestStreams.stdout}
            </div>
          </section>
          <section style={{ padding: "20px 24px" }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Latest stderr + exit</div>
            <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 16, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", minHeight: 110, color: latestStreams.stderr === "—" ? "var(--ink-3)" : "var(--error)" }}>
              {latestStreams.stderr}
            </div>
            <div className="mono" style={{ marginTop: 8, fontSize: 10, color: "var(--ink-3)" }}>
              exitCode {latestStreams.exitCode === null ? "running" : latestStreams.exitCode}
            </div>
          </section>
        </div>
      )}
    </MarketplaceShell>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div style={{ padding: "20px 24px", borderRight: "1px solid var(--rule-soft)" }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: 0.08 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 500 }}>{value}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>{detail}</div>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18 }}>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 500 }}>{title}</div>
      <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.7, color: "var(--ink-3)" }}>{copy}</p>
    </div>
  );
}
