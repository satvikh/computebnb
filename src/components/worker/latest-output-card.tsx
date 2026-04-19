"use client";

import { AlertTriangle, CheckCircle2, Clock3, FileOutput } from "lucide-react";
import { formatTimeAgo } from "@/src/lib/format";
import type { LatestOutputStatus } from "@/src/types/worker";

const tone = {
  idle: {
    icon: Clock3,
    label: "Waiting",
    className: "border-white/10 bg-white/[0.04] text-zinc-200"
  },
  running: {
    icon: FileOutput,
    label: "Streaming",
    className: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
  },
  ready: {
    icon: CheckCircle2,
    label: "Verified",
    className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
  },
  failed: {
    icon: AlertTriangle,
    label: "Blocked",
    className: "border-rose-300/20 bg-rose-300/10 text-rose-100"
  }
} as const;

export function LatestOutputCard({ latestOutput }: { latestOutput: LatestOutputStatus }) {
  const meta = tone[latestOutput.state];
  const Icon = meta.icon;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Latest output</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{latestOutput.summary}</h2>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${meta.className}`}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>
      <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-medium text-white">{latestOutput.jobName}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{latestOutput.detail}</p>
      </div>
      <p className="mt-4 text-xs text-zinc-500">Updated {formatTimeAgo(latestOutput.updatedAt)}</p>
    </section>
  );
}
