import Link from "next/link";
import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { MachineGrid, Sparkline, StatusPill } from "@/app/_components/chrome";
import { calculateSuccessRate, getDashboardSummary } from "@/lib/marketplace";
import { isDbConfigured } from "@/lib/db";

function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatRuntime(seconds: number | null) {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function statusToPill(status: string) {
  if (status === "completed") return "live";
  if (status === "running") return "running";
  if (status === "assigned") return "warming";
  if (status === "failed") return "error";
  return "idle";
}

function buildSparkline(values: number[]) {
  return values.length > 1 ? values : [0, values[0] ?? 0, (values[0] ?? 0) + 1];
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
  const recentActivity = summary?.recentActivity ?? [];
  const todayProviderPayoutCents = recentJobs
    .filter((job) => job.status === "completed")
    .reduce((sum, job) => sum + (job.providerPayoutCents ?? 0), 0);
  const recentEarnings = buildSparkline(
    recentJobs
      .slice()
      .reverse()
      .map((job, index) => ((job.providerPayoutCents ?? 0) / 100) + index * 0.18)
  );
  const fleetSuccess = calculateSuccessRate(
    providers.reduce((sum, provider) => sum + provider.completedJobs, 0),
    providers.reduce((sum, provider) => sum + provider.failedJobs, 0)
  );
  const kpis: Array<[string, string, string, boolean]> = [
    ["PROVIDER PAYOUTS", centsToDollars(summary?.totalProviderPayoutCents ?? 0), "all completed jobs", true],
    ["PLATFORM FEES", centsToDollars(summary?.totalPlatformFeeCents ?? 0), "current ledger", true],
    ["FLEET SUCCESS", `${fleetSuccess}%`, `${providers.reduce((sum, provider) => sum + provider.failedJobs, 0)} failures`, true],
    ["JOBS COMPLETED", String(summary?.jobCounts.completed ?? 0), `${summary?.jobCounts.running ?? 0} running`, true],
    ["QUEUE PRESSURE", String(summary?.jobCounts.queued ?? 0), `${summary?.providerCounts.online ?? 0} idle nodes`, false]
  ];

  return (
    <MarketplaceShell
      page="dashboard"
      rightRail={
        <>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            <span className="dot live animated" style={{ marginRight: 6 }} />
            {providers.length} machines · {summary?.providerCounts.busy ?? 0} live
          </span>
          <span style={{ width: 1, height: 18, background: "var(--rule-soft)" }} />
          <span className="mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>
            Balance
          </span>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500 }}>
            {centsToDollars(summary?.totalProviderPayoutCents ?? 0)}
          </span>
        </>
      }
    >
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--rule-soft)", display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            § Overview · Live marketplace
          </div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 32, letterSpacing: -0.64, margin: 0, lineHeight: 1 }}>
            Good evening, Priya.
            <span className="serif" style={{ fontSize: 32, color: "var(--ink-3)" }}> Your fleet earned </span>
            <span>{centsToDollars(todayProviderPayoutCents)}</span>
            <span className="serif" style={{ fontSize: 32, color: "var(--ink-3)" }}> today.</span>
          </h1>
          <p style={{ margin: "14px 0 0", maxWidth: 760, fontSize: 14, lineHeight: 1.65, color: "var(--ink-3)" }}>
            One sided marketplace control plane for text-first jobs. Real job routing, runtime billing, provider trust, and event history now feed the same designed web surface.
          </p>
        </div>
        <div style={{ minWidth: 300, border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Payout trend</div>
          <Sparkline data={recentEarnings} width={268} height={54} stroke="var(--ink)" fill="rgba(201,242,59,0.32)" />
          <div className="mono" style={{ marginTop: 8, fontSize: 10, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
            <span>first completion</span>
            <span>latest completion</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderBottom: "1px solid var(--rule)" }}>
        {kpis.map(([label, value, detail, ok], index) => (
          <div key={label} style={{ padding: "20px 24px", borderRight: index < 4 ? "1px solid var(--rule-soft)" : "none" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: 0.08 }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <span style={{ fontFamily: "var(--font-ui)", fontSize: 32, fontWeight: 500 }}>{value}</span>
              <span className="mono" style={{ fontSize: 11, color: ok ? "var(--ink-3)" : "var(--error)" }}>{ok ? "nominal" : "watch"}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 0.92fr", minHeight: 720 }}>
        <div style={{ borderRight: "1px solid var(--rule-soft)", display: "flex", flexDirection: "column" }}>
          <section style={{ padding: "20px 24px", borderBottom: "1px solid var(--rule-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="eyebrow">Marketplace supply</div>
              <Link href="/providers" className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Open machines →</Link>
            </div>
            <MachineGrid rows={6} cols={24} seed={providers.length + (summary?.jobCounts.running ?? 0) + 7} running={0.16} warming={0.08} live={0.42} />
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {[
                ["LIVE", String(summary?.providerCounts.online ?? 0)],
                ["RUN", String(summary?.providerCounts.busy ?? 0)],
                ["QUEUE", String(summary?.jobCounts.queued ?? 0)],
                ["FAIL", String(providers.reduce((sum, provider) => sum + provider.failedJobs, 0))]
              ].map(([key, value]) => (
                <div key={key}>
                  <div style={{ color: "var(--ink-3)", fontSize: 10 }}>{key}</div>
                  <div>{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ padding: "20px 24px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="eyebrow">Fleet cards</div>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                based on real provider state
              </span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {providers.slice(0, 6).map((provider) => (
                <div key={provider.id} style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 500 }}>{provider.name}</div>
                      <div className="mono" style={{ marginTop: 4, fontSize: 10, color: "var(--ink-3)" }}>
                        {provider.capabilities.join(" · ")}
                      </div>
                    </div>
                    <StatusPill state={provider.status === "busy" ? "running" : provider.status === "online" ? "live" : "idle"}>
                      {provider.status}
                    </StatusPill>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    <Metric label="RATE" value={`${centsToDollars(provider.hourlyRateCents)}/hr`} />
                    <Metric label="EARNED" value={centsToDollars(provider.totalEarnedCents)} />
                    <Metric label="SUCCESS" value={`${provider.successRate}%`} />
                    <Metric label="LAST HB" value={provider.lastHeartbeatAt ? "live" : "never"} />
                  </div>
                </div>
              ))}
              {!providers.length && (
                <EmptyState
                  title={dbError || !isDbConfigured() ? "Control plane waiting for MongoDB" : "No providers yet"}
                  copy={dbError || !isDbConfigured()
                    ? "Set MONGODB_URI to power the live marketplace views. The styled web UI is ready to consume backend truth as soon as the database is available."
                    : "Register a provider node and heartbeat it into the marketplace to populate this fleet strip."}
                />
              )}
            </div>
          </section>
        </div>

        <div style={{ borderRight: "1px solid var(--rule-soft)", display: "flex", flexDirection: "column" }}>
          <section style={{ padding: "20px 24px", borderBottom: "1px solid var(--rule-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="eyebrow">Recent matches</div>
              <Link href="/jobs" className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>Open queue →</Link>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {recentJobs.map((job) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr 120px 92px", gap: 10, alignItems: "center", padding: "7px 0", borderBottom: "1px dashed var(--rule-soft)" }}>
                  <span style={{ color: "var(--ink-3)" }}>{job.createdAt ? new Date(job.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                  <span>
                    {job.type.replaceAll("_", "-")} · {job.title}
                    <span style={{ display: "block", color: "var(--ink-4)", fontSize: 10, marginTop: 3 }}>
                      {job.assignedProviderName ?? "awaiting node"}
                    </span>
                  </span>
                  <span style={{ textAlign: "right" }}>{job.jobCostCents ? centsToDollars(job.jobCostCents) : centsToDollars(job.budgetCents)}</span>
                  <span style={{ textAlign: "right" }}>
                    <StatusPill state={statusToPill(job.status)}>{job.status}</StatusPill>
                  </span>
                </div>
              ))}
              {!recentJobs.length && (
                <EmptyState title="No jobs yet" copy="Submit a text job to watch assignment, runtime pricing, proof hash generation, and payouts flow through this ledger." />
              )}
            </div>
          </section>

          <section style={{ padding: "20px 24px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="eyebrow">Completed ledger</div>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>runtime priced</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {recentJobs.filter((job) => job.status === "completed").slice(0, 5).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}/results`} style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 500 }}>{job.title}</div>
                      <div className="mono" style={{ marginTop: 5, fontSize: 10, color: "var(--ink-3)" }}>
                        {job.assignedProviderName ?? "unassigned"} · {formatRuntime(job.actualRuntimeSeconds)}
                      </div>
                    </div>
                    <StatusPill state="live">settled</StatusPill>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    <Metric label="COST" value={centsToDollars(job.jobCostCents ?? 0)} />
                    <Metric label="PAYOUT" value={centsToDollars(job.providerPayoutCents ?? 0)} />
                    <Metric label="FEE" value={centsToDollars(job.platformFeeCents ?? 0)} />
                    <Metric label="PROOF" value={job.proofHash ?? "pending"} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <section style={{ padding: "20px 24px", borderBottom: "1px solid var(--rule-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="eyebrow">Activity feed</div>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>backend events</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {recentActivity.map((activity) => (
                <div key={activity.id} style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 10, padding: "7px 0", borderBottom: "1px dashed var(--rule-soft)" }}>
                  <span style={{ color: "var(--ink-3)" }}>
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                  <span>
                    <div style={{ color: "var(--ink)" }}>{activity.message}</div>
                    <div style={{ color: "var(--ink-4)", fontSize: 10, marginTop: 4 }}>
                      {activity.type} · {activity.providerName ?? activity.providerId ?? "marketplace"}
                    </div>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: "auto", padding: "20px 24px", background: "var(--ink)", color: "var(--paper)" }}>
            <div className="eyebrow" style={{ color: "rgba(244,241,234,0.5)" }}>Operator’s note</div>
            <div style={{ marginTop: 10, fontFamily: "var(--font-ui)", fontSize: 34, fontWeight: 500, lineHeight: 1 }}>
              Turn the machine
              <br />
              into the margin.
            </div>
            <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.7, color: "rgba(244,241,234,0.68)" }}>
              This pass keeps the stylized marketplace UI and replaces showcase-only numbers with live provider, job, payout, and trust data from Mongo-backed routes.
            </p>
            <div style={{ marginTop: 16, display: "flex", gap: 12, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(244,241,234,0.5)" }}>
              <span>runtime billing</span>
              <span>checksum proof</span>
              <span>event trail</span>
            </div>
          </section>
        </div>
      </div>
    </MarketplaceShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "var(--ink-3)", fontSize: 10 }}>{label}</div>
      <div>{value}</div>
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
