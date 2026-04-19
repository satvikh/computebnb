"use client";

import { useWorker } from "@/src/hooks/use-worker";

export default function ProviderDashboardPage() {
  const { state, startWorker, stopWorker } = useWorker();

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Producer dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold">{state.machine.name}</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Metric label="CPU" value={state.machine.cpu} />
            <Metric label="RAM" value={`${state.machine.memoryGb} GB`} />
            <Metric label="Status" value={state.machine.status} />
            <Metric label="Availability" value={state.availability} />
          </div>

          <div className="mt-8 flex gap-3">
            <button className="rounded-md bg-lime-300 px-4 py-2 font-medium text-zinc-950" onClick={startWorker}>
              Set active
            </button>
            <button className="rounded-md border border-white/10 px-4 py-2" onClick={stopWorker}>
              Set inactive
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold">Current job</h2>
              {state.activeJob ? (
                <div className="mt-4 space-y-2 text-sm text-zinc-300">
                  <p>{state.activeJob.name}</p>
                  <p>Status: {state.activeJob.status}</p>
                  <p>Progress: {state.activeJob.progress}%</p>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-400">
                    {state.activeJob.executionOutput ?? "Waiting for output"}
                  </pre>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">No active job.</p>
              )}
            </section>

            <section className="rounded-xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold">Latest output</h2>
              <pre className="mt-4 whitespace-pre-wrap font-mono text-xs text-zinc-400">
                {state.latestOutput.detail}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}
