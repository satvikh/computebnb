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
    <main className="gpu-root min-h-screen bg-[#f4f1ea] text-[#141410]">
      <div className="mx-auto max-w-[1520px] px-4 py-5 lg:px-5">
        <div className="mb-5 flex flex-col gap-4 border-b border-black/12 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">$ job output · remote execution ledger</p>
            <h1 className="mt-3 text-[48px] font-semibold leading-[0.95] tracking-[-0.07em] sm:text-[62px]">
              Inspect the run. <span className="serif text-[0.86em] tracking-[-0.04em]">Read the output, verify the payment.</span>
            </h1>
          </div>
          <Link href="/jobs" className="mono inline-flex h-[42px] items-center border border-black/35 bg-white/30 px-4 text-[11px] uppercase tracking-[0.14em] text-black/66">
            ← back to jobs
          </Link>
        </div>

        {error ? (
          <div className="mb-5 border border-[#c4352b]/40 bg-[#c4352b]/8 px-4 py-3 text-[13px] text-[#8f251d]">
            {error}
          </div>
        ) : null}

        {!job ? (
          <div className="text-sm text-black/48">Loading…</div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Status" value={job.status} />
                <Metric label="Machine" value={job.machineName ?? "Unknown"} />
                <Metric label="Exit code" value={job.exitCode === null ? "pending" : String(job.exitCode)} />
                <Metric label="Started" value={job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : "not started"} />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Budget ceiling" value={formatUsdFromCents(job.budgetCents)} />
                <Metric label="Charged" value={job.jobCostCents === null ? "pending" : formatUsdFromCents(job.jobCostCents)} />
                <Metric label="Provider payout" value={job.providerPayoutCents === null ? "pending" : formatUsdFromCents(job.providerPayoutCents)} />
                <Metric label="Payment" value={job.solanaPaymentStatus} />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
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
              </div>
            </section>

            <aside className="border border-black/85 bg-[#171611] p-5 text-[#f4f1ea]">
              <p className="eyebrow flex items-center gap-2 text-white/45">
                <span className="dot live animated" />
                Settlement
              </p>
              <h2 className="mt-5 text-[40px] font-semibold leading-[0.96] tracking-[-0.07em]">{job.filename ?? "script.py"}</h2>
              <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-white/34">
                {job.machineName ?? "unknown machine"} · runtime {job.actualRuntimeSeconds ?? "—"}s · {job.solanaPaymentStatus}
              </p>

              <div className="mt-7 border-b border-white/10 pb-6">
                <div className="flex items-end gap-1">
                  <span className="text-[70px] font-semibold leading-none tracking-[-0.1em]">
                    {job.jobCostCents === null ? "$0" : formatUsdFromCents(job.jobCostCents).split(".")[0]}
                  </span>
                  <span className="pb-2 text-[32px] font-semibold tracking-[-0.06em]">
                    {job.jobCostCents === null ? ".00" : `.${formatUsdFromCents(job.jobCostCents).split(".")[1]}`}
                  </span>
                </div>
                <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-white/30">captured for this run</p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4 border-b border-white/10 pb-6">
                <SideStat label="Consumer" value={formatUsdFromCents(job.jobCostCents ?? 0)} sub="charged" />
                <SideStat label="Provider" value={formatUsdFromCents(job.providerPayoutCents ?? 0)} sub="payout" />
                <SideStat label="Platform" value={formatUsdFromCents(job.platformFeeCents ?? 0)} sub="fee" />
                <SideStat label="FX rate" value={job.solanaCentsPerSol ? `${job.solanaCentsPerSol}` : "—"} sub="cents / SOL" />
              </div>

              <div className="mt-7 border-b border-white/10 pb-6">
                <p className="eyebrow text-white/35">Payment settlement</p>
                <pre className="mono mt-4 whitespace-pre-wrap text-[11px] leading-6 text-white/60">{[
                  `Status: ${job.solanaPaymentStatus}`,
                  `Signature: ${job.solanaPaymentSignature ?? "pending"}`,
                  `Lamports: ${job.solanaPaymentLamports ?? 0}`,
                  `Runtime: ${job.actualRuntimeSeconds ?? "—"} seconds`,
                  `Platform fee: ${job.platformFeeCents === null ? "pending" : formatUsdFromCents(job.platformFeeCents)}`,
                ].join("\n")}</pre>
              </div>

              <div className="mt-7">
                <p className="eyebrow text-white/35">Run summary</p>
                <div className="mono mt-4 space-y-2 text-[11px] uppercase tracking-[0.13em] text-white/58">
                  <div className="flex gap-3"><span className="text-white/30">01</span><span>job claimed by producer</span></div>
                  <div className="flex gap-3"><span className="text-white/30">02</span><span>docker execution completed</span></div>
                  <div className="flex gap-3"><span className="text-white/30">03</span><span>stdout/stderr written to backend</span></div>
                  <div className="flex gap-3"><span className="text-white/30">04</span><span>payment ledger updated</span></div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black/18 bg-white/24 p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <section className="border border-black/18 bg-[#f6f2e8] p-5">
      <h2 className="text-[26px] font-semibold tracking-[-0.04em]">{title}</h2>
      <pre className="mono mt-4 whitespace-pre-wrap text-[13px] leading-6 text-black/78">{body}</pre>
    </section>
  );
}

function SideStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="eyebrow text-white/32">{label}</p>
      <p className="mt-2 text-[22px] font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-[11px] text-white/38">{sub}</p>
    </div>
  );
}
