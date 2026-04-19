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

function statusToPill(status: string): "live" | "running" | "warming" | "error" | "idle" {
  if (status === "completed") return "live";
  if (status === "running") return "running";
  if (status === "assigned") return "warming";
  if (status === "failed") return "error";
  return "idle";
}

function parseResult(result: string | null) {
  if (!result) return null;
  try {
    const parsed = JSON.parse(result) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

function stdoutSnippet(stdout: string | null, result: string | null) {
  const parsed = parseResult(result);
  const output = stdout || (parsed && typeof parsed.output === "string" ? parsed.output : result);
  if (!output) return "pending";
  return output.length > 72 ? `${output.slice(0, 72)}…` : output;
}

function stderrSnippet(error: string | null, failureReason: string | null) {
  const message = error ?? failureReason;
  if (!message) return "—";
  return message.length > 60 ? `${message.slice(0, 60)}…` : message;
}

function exitCode(status: string) {
  if (status === "completed") return 0;
  if (status === "failed") return 1;
  return "—";
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
          <div className="eyebrow" style={{ marginBottom: 6 }}>§ Step 03 · Track jobs</div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontSize: 56, fontWeight: 500, letterSpacing: -2, lineHeight: 0.95, margin: 0 }}>
            Status, streams,
            <br />
            <span className="serif" style={{ fontSize: 56 }}>and exit codes.</span>
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
          Every row shows machine targeting metadata, live state, and runtime output surfaces mapped to stdout/stderr/exitCode for the MVP contract.
        </p>
      </div>

      <div style={{ padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "110px 170px 90px 110px 60px 1fr 1fr 100px", gap: 12, padding: "0 0 10px", borderBottom: "1px solid var(--rule)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: 0.08 }}>
          <span>JOB</span>
          <span>TARGET MACHINE</span>
          <span>RUNTIME</span>
          <span>COST</span>
          <span>EXIT</span>
          <span>STDOUT</span>
          <span>STDERR</span>
          <span style={{ textAlign: "right" }}>STATE</span>
        </div>

        <div style={{ display: "grid" }}>
          {jobs.map((job) => {
            const targetMachine = job.machineName ?? job.assignedProviderName ?? "scheduler";
            return (
              <Link key={job.id} href={`/jobs/${job.id}/results`} style={{ display: "grid", gridTemplateColumns: "110px 170px 90px 110px 60px 1fr 1fr 100px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: "1px dashed var(--rule-soft)", fontSize: 12 }}>
                <span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>{job.id.slice(-8)}</span>
                  <span style={{ display: "block", marginTop: 5, fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>
                    {job.title}
                  </span>
                </span>
                <span className="mono" style={{ color: "var(--ink-2)" }}>{targetMachine}</span>
                <span className="mono">{formatRuntime(job.actualRuntimeSeconds)}</span>
                <span className="mono">{job.jobCostCents ? centsToDollars(job.jobCostCents) : centsToDollars(job.budgetCents)}</span>
                <span className="mono">{exitCode(job.status)}</span>
                <span className="mono" style={{ color: "var(--ink-3)" }}>{stdoutSnippet(job.stdout, job.result)}</span>
                <span className="mono" style={{ color: job.failureReason || job.error ? "var(--error)" : "var(--ink-3)" }}>
                  {stderrSnippet(job.stderr || job.error, job.failureReason)}
                </span>
                <span style={{ textAlign: "right" }}>
                  <StatusPill state={statusToPill(job.status)}>{job.status}</StatusPill>
                </span>
              </Link>
            );
          })}

          {!jobs.length && (
            <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 24, marginTop: 18 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 500 }}>No jobs yet.</div>
              <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
                {isDbConfigured()
                  ? "Choose a machine, submit Python, and this queue will display status transitions with stdout/stderr/exitCode."
                  : "Configure MongoDB first, then submit your first machine-targeted Python job."}
              </p>
              <Link href="/jobs/new" style={{ marginTop: 14, display: "inline-flex", padding: "10px 14px", borderRadius: 2, background: "var(--ink)", color: "var(--paper)", fontSize: 12, fontWeight: 500 }}>
                Create job →
              </Link>
            </div>
          )}
        </div>
      </div>
    </MarketplaceShell>
  );
}
