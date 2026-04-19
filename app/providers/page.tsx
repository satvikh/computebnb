import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { StatusPill } from "@/app/_components/chrome";
import { listProvidersSummary } from "@/lib/marketplace";
import { isDbConfigured } from "@/lib/db";
import { markStaleProvidersOffline } from "@/lib/scheduling";
import Link from "next/link";

function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function statusToPill(status: string) {
  if (status === "online") return "live";
  if (status === "busy") return "running";
  return "idle";
}

function heartbeatLabel(heartbeat: Date | null) {
  if (!heartbeat) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(heartbeat).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  let providers: Awaited<ReturnType<typeof listProvidersSummary>> = [];
  let dbUnavailable = false;

  try {
    if (isDbConfigured()) {
      await markStaleProvidersOffline();
      providers = await listProvidersSummary();
    }
  } catch {
    dbUnavailable = true;
  }

  const onlineProviders = providers.filter((provider) => provider.status === "online").length;
  const busyProviders = providers.filter((provider) => provider.status === "busy").length;

  return (
    <MarketplaceShell page="dashboard">
      <div style={{ padding: "24px", borderBottom: "1px solid var(--rule-soft)", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "end" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>§ Step 01 · Browse machines</div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontSize: 48, fontWeight: 500, lineHeight: 0.96, margin: 0 }}>
            Pick a machine.
            <br />
            <span className="serif" style={{ fontSize: 48, color: "var(--ink-3)" }}>Send Python code right after.</span>
          </h1>
        </div>
        <div style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
          This machine roster comes from live provider heartbeats. Choose one to prefill the submission form with that machine as the target.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--rule)" }}>
        <Metric label="MACHINES LISTED" value={String(providers.length)} />
        <Metric label="ONLINE" value={String(onlineProviders)} />
        <Metric label="BUSY" value={String(busyProviders)} />
        <Metric label="AVG RATE" value={providers.length ? `${centsToDollars(Math.round(providers.reduce((sum, provider) => sum + provider.hourlyRateCents, 0) / providers.length))}/hr` : "—"} />
      </div>

      <div style={{ padding: "24px", display: "grid", gap: 14 }}>
        {providers.map((provider) => (
          <div key={provider.id} style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 0.8fr auto", gap: 18, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: 28, fontWeight: 500 }}>{provider.name}</div>
                  <StatusPill state={statusToPill(provider.status)}>
                    {provider.status}
                  </StatusPill>
                </div>
                <div className="mono" style={{ marginTop: 8, fontSize: 11, color: "var(--ink-3)" }}>
                  {provider.capabilities.join(" · ")}
                </div>
              </div>
              <Metric label="Spot rate" value={`${centsToDollars(provider.hourlyRateCents)}/hr`} />
              <Metric label="Reliability" value={`${provider.successRate}%`} />
              <Metric label="Completed" value={String(provider.completedJobs)} />
              <Metric label="Heartbeat" value={heartbeatLabel(provider.lastHeartbeatAt)} />
              <Link
                href={`/jobs/new?machine=${provider.id}`}
                style={{
                  padding: "10px 14px",
                  borderRadius: 2,
                  background: "var(--ink)",
                  color: "var(--paper)",
                  fontFamily: "var(--font-ui)",
                  fontSize: 12,
                  fontWeight: 500,
                  textAlign: "center",
                  whiteSpace: "nowrap"
                }}
              >
                Choose machine →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--rule-soft)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <Metric label="Failed" value={String(provider.failedJobs)} />
              <Metric label="Total earned" value={centsToDollars(provider.totalEarnedCents)} />
              <Metric label="Scheduler lane" value={provider.status === "busy" ? "executing job" : provider.status === "online" ? "open to match" : "offline"} />
              <Metric label="Machine class" value={provider.capabilities[0] ?? "cpu"} />
            </div>
          </div>
        ))}

        {!providers.length && (
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 24 }}>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 500 }}>No machines available yet.</div>
            <p style={{ margin: "12px 0 0", maxWidth: 640, fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
              {dbUnavailable || !isDbConfigured()
                ? "Set your MongoDB environment first, then register and heartbeat provider nodes so machines appear here."
                : "Providers have not heartbeated recently. Start a worker and refresh this page."}
            </p>
          </div>
        )}
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
