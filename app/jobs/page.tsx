import Link from "next/link";
import { redirect } from "next/navigation";
import { listUserJobs } from "@/lib/mvp";
import { formatUsdFromCents } from "@/lib/payment-config";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await readSessionUser();
  if (!user || user.role !== "consumer") {
    redirect("/login");
  }

  const jobs = await listUserJobs(user.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">My jobs</p>
            <h1 className="mt-3 text-4xl font-semibold">Submitted Python jobs</h1>
          </div>
          <Link href="/machines" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
            Machines
          </Link>
        </div>

        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{job.filename ?? "script.py"}</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Machine: {job.machineName ?? job.machineId} | Status: {job.status}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {job.jobCostCents !== null
                      ? `Charged ${formatUsdFromCents(job.jobCostCents)} · payment ${job.solanaPaymentStatus}`
                      : `Budget ceiling ${formatUsdFromCents(job.budgetCents)} · payment ${job.solanaPaymentStatus}`}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300">
                  {job.status}
                </span>
              </div>
            </Link>
          ))}

          {!jobs.length ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
              You have not submitted any jobs yet.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
