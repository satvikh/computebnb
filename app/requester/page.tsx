import Link from "next/link";
import { isDbConfigured } from "@/lib/db";
import { getDbUnavailablePayload, listJobsSummary, listProvidersSummary } from "@/lib/marketplace";
import { sampleJobPayload, sampleJobs } from "@/lib/sample-jobs";

function cents(centsValue: number | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((centsValue ?? 0) / 100);
}

function providerTone(status: string) {
  if (status === "online") return "bg-emerald-300";
  if (status === "busy") return "bg-cyan-200";
  return "bg-zinc-600";
}

export const dynamic = "force-dynamic";

export default async function RequesterPage() {
  let providers: Awaited<ReturnType<typeof listProvidersSummary>> = [];
  let jobs: Awaited<ReturnType<typeof listJobsSummary>> = [];
  let dbUnavailable = !isDbConfigured();

  try {
    if (isDbConfigured()) {
      [providers, jobs] = await Promise.all([listProvidersSummary(), listJobsSummary()]);
    }
  } catch {
    dbUnavailable = true;
  }

  const onlineProviders = providers.filter((provider) => provider.status === "online");
  const runningJobs = jobs.filter((job) => job.status === "running" || job.status === "assigned");

  return (
    <main className="min-h-screen overflow-hidden bg-[#080a09] text-white">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(8,10,9,0.94),rgba(8,10,9,0.98)_60%,rgba(22,15,9,0.92))]" />
      <div className="relative mx-auto max-w-[1540px] px-5 py-5 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-white/10 bg-black/25 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Requester dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Send approved jobs to live providers.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Pick a provider-ready workload, queue it through the marketplace API, and watch assignment, execution, payout, and result status move through MongoDB.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/provider/auth" className="rounded-md border border-white/10 px-3 py-2 text-zinc-300 transition hover:bg-white/10">Provider app</Link>
            <Link href="/dashboard" className="rounded-md border border-white/10 px-3 py-2 text-zinc-300 transition hover:bg-white/10">Marketplace view</Link>
          </div>
        </header>

        {dbUnavailable ? (
          <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
            Database is not available. {getDbUnavailablePayload().configured ? "Check the MongoDB connection." : "Set MONGODB_URI to submit and inspect real jobs."}
          </div>
        ) : null}

        <section className="mt-5 grid gap-3 md:grid-cols-4">
          <Metric label="Providers" value={String(providers.length)} detail={`${onlineProviders.length} ready now`} />
          <Metric label="Running" value={String(runningJobs.length)} detail="assigned or executing" tone="cool" />
          <Metric label="Queued" value={String(jobs.filter((job) => job.status === "queued").length)} detail="waiting for a provider" tone="warm" />
          <Metric label="Paid out" value={cents(jobs.reduce((sum, job) => sum + (job.providerPayoutCents ?? 0), 0))} detail="completed provider earnings" />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Provider pool</p>
                <h2 className="mt-2 text-xl font-semibold">Available machines</h2>
              </div>
              <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-500">Mongo-backed</span>
            </div>
            <div className="mt-5 grid gap-3">
              {providers.map((provider) => (
                <div key={provider.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${providerTone(provider.status)}`} />
                        <p className="font-semibold text-white">{provider.name}</p>
                      </div>
                      <p className="mt-2 font-mono text-xs text-zinc-500">{provider.capabilities.join(" / ")}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-400">
                      <p>{provider.status}</p>
                      <p className="mt-1">{cents(provider.hourlyRateCents)}/hr</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-zinc-400">
                    <span>{provider.completedJobs} completed</span>
                    <span>{provider.failedJobs} failed</span>
                    <span>{provider.successRate}% success</span>
                  </div>
                </div>
              ))}
              {!providers.length ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                  No providers are registered yet. Start the Tauri provider app or worker CLI to populate this list.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Request jobs</p>
            <h2 className="mt-2 text-xl font-semibold">Sample scripts to send</h2>
            <div className="mt-5 grid gap-4">
              {sampleJobs.map((job) => (
                <form key={job.id} action="/api/jobs" method="post" className="rounded-lg border border-white/10 bg-black/25 p-4">
                  <input type="hidden" name="title" value={job.title} />
                  <input type="hidden" name="type" value={job.type} />
                  <input type="hidden" name="input" value={job.input} />
                  <input type="hidden" name="budgetCents" value={job.budgetCents} />
                  <input type="hidden" name="requiredCapabilities" value={job.requiredCapabilities.join(",")} />
                  <input type="hidden" name="runnerPayload" value={sampleJobPayload(job)} />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{job.title}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{job.description}</p>
                    </div>
                    <button className="rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200" type="submit">
                      Queue request
                    </button>
                  </div>
                  <pre className="mt-4 max-h-48 overflow-auto rounded-md border border-white/10 bg-[#070807] p-3 font-mono text-xs leading-5 text-zinc-300">{sampleJobPayload(job)}</pre>
                </form>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.055] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Recent requests</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
            {jobs.slice(0, 8).map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}/results`} className="grid gap-3 border-b border-white/10 bg-black/20 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_140px_140px_120px]">
                <span>
                  <span className="font-semibold text-white">{job.title}</span>
                  <span className="mt-1 block font-mono text-xs text-zinc-500">{job.type} / {job.assignedProviderName ?? "unassigned"}</span>
                </span>
                <span className="text-zinc-400">{job.status}</span>
                <span className="text-zinc-400">{cents(job.budgetCents)}</span>
                <span className="text-zinc-400">{job.proofHash ?? "pending"}</span>
              </Link>
            ))}
            {!jobs.length ? <div className="bg-black/20 px-4 py-6 text-sm text-zinc-400">No requests yet.</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, detail, tone = "green" }: { label: string; value: string; detail: string; tone?: "green" | "cool" | "warm" }) {
  const color = tone === "cool" ? "text-cyan-200" : tone === "warm" ? "text-amber-200" : "text-emerald-200";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}
