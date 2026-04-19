import { notFound } from "next/navigation";
import { MarketplaceShell } from "@/app/_components/marketplace-shell";
import { JobResultsLive } from "@/app/_components/job-results-live";
import { getJobDetail } from "@/lib/marketplace";
import { isDbConfigured } from "@/lib/db";

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
  const job = {
    ...detail.job,
    result: detail.job.result ?? null,
    error: detail.job.error ?? null,
    failureReason: detail.job.failureReason ?? null,
    jobCostCents: detail.job.jobCostCents ?? null,
    providerPayoutCents: detail.job.providerPayoutCents ?? null,
    platformFeeCents: detail.job.platformFeeCents ?? null,
    assignedProviderName: detail.job.assignedProviderName ?? null,
    actualRuntimeSeconds: detail.job.actualRuntimeSeconds ?? null,
    proofHash: detail.job.proofHash ?? null
  };
  const events = detail.events.map((event) => ({
    ...event,
    providerId: event.providerId ?? null,
    providerName: event.providerName ?? null,
    createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null
  }));

  return (
    <MarketplaceShell page="dashboard">
      <JobResultsLive initialJob={job} initialEvents={events} />
    </MarketplaceShell>
  );
}
