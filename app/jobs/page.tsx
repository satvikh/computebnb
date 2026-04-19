import Link from "next/link";
import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { StatusPill } from "@/app/_components/chrome";
import { listJobsSummary } from "@/lib/marketplace";
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

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  let jobs: Awaited<ReturnType<typeof listJobsSummary>> = [];

  try {
    if (isDbConfigured()) {
      jobs = await listJobsSummary();
    }
  } catch {
    jobs = [];
  }

  return (
    <MarketplaceShell page="dashboard">
      <div style={{ padding: "24px", borderBottom: "1px solid var(--rule-soft)", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "end" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>§ Jobs board</div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontSize: 56, fontWeight: 500, letterSpacing: -2, lineHeight: 0.95, margin: 0 }}>
            One sided marketplace,
            <br />
            <span className="serif" style={{ fontSize: 56 }}>fully legible.</span>
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
          Every job row carries the core demo truth: status, provider, runtime, cost, payout, fee, retries, and proof hash. No local mock worker state is used here.
        </p>
      </div>

      <div style={{ padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 1.2fr 140px 120px 120px 120px 1fr 110px", gap: 12, padding: "0 0 10px", borderBottom: "1px solid var(--rule)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: 0.08 }}>
          <span>JOB</span>
          <span>WORKLOAD</span>
          <span>PROVIDER</span>
          <span>RUNTIME</span>
          <span>COST</span>
          <span>PAYOUT</span>
          <span>PROOF / FAILURE</span>
          <span style={{ textAlign: "right" }}>STATE</span>
        </div>

        <div style={{ display: "grid" }}>
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}/results`} style={{ display: "grid", gridTemplateColumns: "140px 1.2fr 140px 120px 120px 120px 1fr 110px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: "1px dashed var(--rule-soft)", fontSize: 12 }}>
              <span className="mono" style={{ color: "var(--ink-3)" }}>{job.id.slice(-8)}</span>
              <span>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 20, fontWeight: 500 }}>{job.title}</span>
                <span style={{ display: "block", marginTop: 4, color: "var(--ink-4)", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                  {job.type.replaceAll("_", "-")} · budget {centsToDollars(job.budgetCents)}
                </span>
              </span>
              <span className="mono">{job.assignedProviderName ?? "unmatched"}</span>
              <span className="mono">{formatRuntime(job.actualRuntimeSeconds)}</span>
              <span className="mono">{job.jobCostCents ? centsToDollars(job.jobCostCents) : "—"}</span>
              <span className="mono">{job.providerPayoutCents ? centsToDollars(job.providerPayoutCents) : "—"}</span>
              <span className="mono" style={{ color: job.failureReason ? "var(--error)" : "var(--ink-3)" }}>
                {job.proofHash ?? job.failureReason ?? "pending"}
              </span>
              <span style={{ textAlign: "right" }}>
                <StatusPill state={statusToPill(job.status)}>{job.status}</StatusPill>
              </span>
            </Link>
          ))}

          {!jobs.length && (
            <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 24, marginTop: 18 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 500 }}>No jobs on the board.</div>
              <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
                {isDbConfigured()
                  ? "Submit a text job to populate the queue and watch scheduling, execution, and pricing flow through the marketplace."
                  : "Configure MongoDB first, then submit a text job to light up the live jobs board."}
              </p>
            </div>
          )}
        </div>
      </div>
    </MarketplaceShell>
  );
}
