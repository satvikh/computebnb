import Link from "next/link";
import { redirect } from "next/navigation";
import { listMarketplaceMachines } from "@/lib/mvp";
import { formatUsdFromCents } from "@/lib/payment-config";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const user = await readSessionUser();
  if (!user || user.role !== "consumer") {
    redirect("/login");
  }

  const machines = await listMarketplaceMachines();

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Marketplace</p>
            <h1 className="mt-3 text-4xl font-semibold">Available producer machines</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Signed in as {user.displayName ?? user.email ?? user.username}. Choose one machine, submit Python, and poll for output.
            </p>
          </div>
          <Link href="/jobs" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
            My jobs
          </Link>
        </div>

        <div className="mt-8 grid gap-4">
          {machines.map((machine) => (
            <div key={machine.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-semibold">{machine.name}</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    CPU: {machine.cpu} | GPU: {machine.gpu} | RAM: {machine.ramGb} GB
                  </p>
                  <p className="mt-2 text-sm text-lime-300">
                    {formatUsdFromCents(machine.hourlyRateCents)}/hour
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300">
                  {machine.status}
                </span>
              </div>
              <div className="mt-5">
                <Link
                  href={`/jobs/new?machineId=${machine.id}`}
                  className="inline-flex rounded-md bg-lime-300 px-4 py-2 text-sm font-medium text-zinc-950"
                >
                  Choose machine
                </Link>
              </div>
            </div>
          ))}

          {!machines.length ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
              No active or busy machines are visible yet. Start a producer and set its machine status to active.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
