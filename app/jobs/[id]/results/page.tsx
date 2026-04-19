import { notFound } from "next/navigation";
import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { StatusPill } from "@/app/_components/chrome";
import { getJobDetail } from "@/lib/marketplace";
import { isDbConfigured } from "@/lib/db";

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

function statusToPill(status: string) {
  if (status === "completed") return "live";
  if (status === "running") return "running";
  if (status === "assigned") return "warming";
  if (status === "failed") return "error";
  return "idle";
}

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) {
    return (
      <MarketplaceShell page="dashboard">
        <div style={{ padding: 28 }}>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: 36, fontWeight: 500 }}>MongoDB is not configured yet.</div>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
            Configure the database first, then revisit this results route to inspect runtime pricing, checksum proof, provider data, and the event timeline.
          </p>
        </div>
      </MarketplaceShell>
    );
  }

  const { id } = await params;
  const detail = await getJobDetail(id);
  if (!detail) notFound();
  const { job, events } = detail;

  return (
    <MarketplaceShell page="dashboard">
      <div style={{ padding: "24px", borderBottom: "1px solid var(--rule-soft)", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>§ Result ledger</div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontSize: 52, fontWeight: 500, letterSpacing: -2, lineHeight: 0.94, margin: 0 }}>{job.title}</h1>
          <div className="mono" style={{ marginTop: 10, fontSize: 11, color: "var(--ink-3)" }}>
            {job.id} · {job.type.replaceAll("_", "-")} · {job.assignedProviderName ?? "unmatched"}
          </div>
        </div>
        <StatusPill state={statusToPill(job.status)}>{job.status}</StatusPill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <section style={{ padding: "24px", borderRight: "1px solid var(--rule-soft)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Input</div>
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14 }}>
            {job.input}
          </div>
        </section>
        <section style={{ padding: "24px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Result</div>
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18, whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14 }}>
            {job.result ?? job.failureReason ?? "Waiting for worker completion."}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 0, borderTop: "1px solid var(--rule-soft)" }}>
        <section style={{ padding: "24px", borderRight: "1px solid var(--rule-soft)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Accounting + trust</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <Panel label="Budget cap" value={centsToDollars(job.budgetCents)} />
            <Panel label="Final cost" value={centsToDollars(job.jobCostCents)} />
            <Panel label="Provider payout" value={centsToDollars(job.providerPayoutCents)} />
            <Panel label="Platform fee" value={centsToDollars(job.platformFeeCents)} />
            <Panel label="Runtime" value={formatRuntime(job.actualRuntimeSeconds)} />
            <Panel label="Provider" value={job.assignedProviderName ?? "pending"} />
            <Panel label="Proof hash" value={job.proofHash ?? "pending"} />
            <Panel label="Retries" value={String(job.retryCount)} />
          </div>
        </section>

        <section style={{ padding: "24px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Event trail</div>
          <div style={{ display: "grid" }}>
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
    </MarketplaceShell>
  );
}

function Panel({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 16 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: 24, fontWeight: 500, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
