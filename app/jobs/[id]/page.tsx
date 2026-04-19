"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatUsdFromCents } from "@/lib/payment-config";

type Job = {
  id: string;
  machineName: string | null;
  status: "queued" | "running" | "completed" | "failed";
  code: string;
  filename: string | null;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  budgetCents: number;
  jobCostCents: number | null;
  providerPayoutCents: number | null;
  platformFeeCents: number | null;
  solanaPaymentLamports: number | null;
  solanaPaymentSignature: string | null;
  solanaPaymentStatus: "pending" | "settled" | "failed";
  solanaCentsPerSol: number | null;
  actualRuntimeSeconds: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) {
      return;
    }
    let cancelled = false;
    let intervalId: number | null = null;

    async function load(id: string) {
      try {
        const response = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load job");
        }
        if (cancelled) {
          return;
        }
        setJob(data.job);
        setError(null);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load job");
      }
    }

    void load(params.id);
    intervalId = window.setInterval(() => void load(params.id), 2500);

    return () => {
      cancelled = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [params]);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Job output</p>
            <h1 className="mt-3 text-4xl font-semibold">{job?.filename ?? "Python job"}</h1>
          </div>
          <Link href="/jobs" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
            Back to jobs
          </Link>
        </div>

        {error ? (
          <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!job ? (
          <div className="text-sm text-zinc-400">Loading…</div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Metric label="Status" value={job.status} />
              <Metric label="Machine" value={job.machineName ?? "Unknown"} />
              <Metric label="Exit code" value={job.exitCode === null ? "pending" : String(job.exitCode)} />
              <Metric label="Started" value={job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : "not started"} />
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Metric label="Budget ceiling" value={formatUsdFromCents(job.budgetCents)} />
              <Metric label="Charged" value={job.jobCostCents === null ? "pending" : formatUsdFromCents(job.jobCostCents)} />
              <Metric label="Provider payout" value={job.providerPayoutCents === null ? "pending" : formatUsdFromCents(job.providerPayoutCents)} />
              <Metric label="Payment" value={job.solanaPaymentStatus} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Python code" body={job.code} />
              <Panel title="stdout" body={job.stdout || "Waiting for output."} />
              <Panel title="stderr" body={job.stderr || "No stderr."} />
              <Panel
                title="Timestamps"
                body={[
                  `Created: ${new Date(job.createdAt).toLocaleString()}`,
                  `Started: ${job.startedAt ? new Date(job.startedAt).toLocaleString() : "—"}`,
                  `Completed: ${job.completedAt ? new Date(job.completedAt).toLocaleString() : "—"}`,
                ].join("\n")}
              />
              <Panel
                title="Payment settlement"
                body={[
                  `Status: ${job.solanaPaymentStatus}`,
                  `Signature: ${job.solanaPaymentSignature ?? "pending"}`,
                  `Lamports: ${job.solanaPaymentLamports ?? 0}`,
                  `FX rate: ${job.solanaCentsPerSol ?? "—"} cents/SOL`,
                  `Runtime: ${job.actualRuntimeSeconds ?? "—"} seconds`,
                  `Platform fee: ${job.platformFeeCents === null ? "pending" : formatUsdFromCents(job.platformFeeCents)}`,
                ].join("\n")}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <pre className="mt-4 whitespace-pre-wrap font-mono text-sm text-zinc-200">{body}</pre>
    </section>
  );
}
