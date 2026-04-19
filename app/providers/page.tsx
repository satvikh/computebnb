import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { StatusPill } from "@/app/_components/chrome";
import { listProvidersSummary } from "@/lib/marketplace";
import { isDbConfigured } from "@/lib/db";
import { markStaleProvidersOffline } from "@/lib/scheduling";

function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  let providers: Awaited<ReturnType<typeof listProvidersSummary>> = [];

  try {
    if (isDbConfigured()) {
      await markStaleProvidersOffline();
      providers = await listProvidersSummary();
    }
  } catch {
    providers = [];
  }

  return (
    <MarketplaceShell page="dashboard">
      <div style={{ padding: "24px", borderBottom: "1px solid var(--rule-soft)", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>§ Supply roster</div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontSize: 48, fontWeight: 500, lineHeight: 0.96, margin: 0 }}>
            One machine worth listing.
            <br />
            <span className="serif" style={{ fontSize: 48, color: "var(--ink-3)" }}>Then an entire fleet.</span>
          </h1>
        </div>
        <div style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
          Live provider inventory with rate, payout history, heartbeat freshness, and reliability signals pulled from the marketplace backend.
        </div>
      </div>

      <div style={{ padding: "24px", display: "grid", gap: 14 }}>
        {providers.map((provider) => (
          <div key={provider.id} style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.9fr 0.8fr", gap: 18, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: 28, fontWeight: 500 }}>{provider.name}</div>
                  <StatusPill state={provider.status === "busy" ? "running" : provider.status === "online" ? "live" : "idle"}>
                    {provider.status}
                  </StatusPill>
                </div>
                <div className="mono" style={{ marginTop: 8, fontSize: 11, color: "var(--ink-3)" }}>
                  {provider.capabilities.join(" · ")}
                </div>
              </div>
              <Metric label="Spot rate" value={`${centsToDollars(provider.hourlyRateCents)}/hr`} />
              <Metric label="Total earned" value={centsToDollars(provider.totalEarnedCents)} />
              <Metric label="Trust" value={`${provider.successRate}% success`} />
              <Metric label="Heartbeat" value={provider.lastHeartbeatAt ? "fresh" : "missing"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--rule-soft)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <Metric label="Completed" value={String(provider.completedJobs)} />
              <Metric label="Failed" value={String(provider.failedJobs)} />
              <Metric label="Status lane" value={provider.status === "busy" ? "receiving jobs" : provider.status === "online" ? "open to match" : "needs heartbeat"} />
              <Metric label="Machine class" value={provider.capabilities[0] ?? "node"} />
            </div>
          </div>
        ))}

        {!providers.length && (
          <div style={{ border: "1px solid var(--rule-soft)", background: "var(--paper-2)", padding: 24 }}>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 500 }}>No live providers yet.</div>
            <p style={{ margin: "12px 0 0", maxWidth: 640, fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)" }}>
              {isDbConfigured()
                ? "Register or heartbeat a provider node to populate this marketplace roster."
                : "Set your MongoDB environment first, then register a provider node to drive the live marketplace inventory."}
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
