import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { NewJobForm } from "@/app/_components/new-job-form";
import { listProvidersSummary } from "@/lib/marketplace";
import { isDbConfigured } from "@/lib/db";
import { markStaleProvidersOffline } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ machine?: string }> }) {
  const params = await searchParams;
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

  const machines = providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    status: provider.status,
    capabilities: provider.capabilities,
    hourlyRateCents: provider.hourlyRateCents,
    successRate: provider.successRate,
    lastHeartbeatAt: provider.lastHeartbeatAt ? new Date(provider.lastHeartbeatAt).toISOString() : null
  }));

  return (
    <MarketplaceShell page="dashboard">
      {machines.length ? (
        <NewJobForm machines={machines} defaultMachineId={params.machine ?? null} />
      ) : (
        <div style={{ padding: "36px 28px", border: "1px solid var(--rule-soft)", margin: 24, background: "var(--paper-2)" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>§ Submit Python</div>
          <div style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 38, letterSpacing: -1.2, lineHeight: 0.98 }}>
            No machines available to target.
          </div>
          <p style={{ maxWidth: 680, margin: "16px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--ink-3)" }}>
            {dbUnavailable || !isDbConfigured()
              ? "Configure MongoDB and start at least one provider worker. Machine browse and submission become available as soon as providers heartbeat into the marketplace."
              : "Providers are currently offline. Start a provider worker and then reopen this page."}
          </p>
        </div>
      )}
    </MarketplaceShell>
  );
}
