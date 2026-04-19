"use client";

import { Gauge, ShieldAlert, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/src/components/worker/app-shell";
import { CpuLimitSlider } from "@/src/components/worker/cpu-limit-slider";
import { SettingToggleRow } from "@/src/components/worker/setting-toggle-row";
import { TrustSafetyCard } from "@/src/components/worker/trust-safety-card";
import { useWorker } from "@/src/hooks/use-worker";

export default function ProviderSettingsPage() {
  const { state, dispatch, startWorker, stopWorker } = useWorker();

  return (
    <AppShell title="Provider settings" eyebrow="Owner policy">
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Availability</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">This MVP runs a single provider on a single machine. Turn availability on only when you want to accept one job at a time.</p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${state.availability === "active" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-zinc-300"}`}>
              {state.availability === "active" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {state.availability}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button className="h-12 bg-emerald-300 text-zinc-950 hover:bg-emerald-200" onClick={startWorker} disabled={state.availability === "active"}>
              <ToggleRight className="mr-2 h-4 w-4" />
              Set provider active
            </Button>
            <Button className="h-12 bg-zinc-100 text-zinc-950 hover:bg-white" onClick={stopWorker} disabled={state.availability === "inactive"}>
              <ToggleLeft className="mr-2 h-4 w-4" />
              Set provider inactive
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            <SettingToggleRow title="Charging-only mode" description="Accept jobs only while connected to power." checked={state.settings.chargingOnly} onCheckedChange={(checked) => dispatch({ type: "UPDATE_SETTINGS", settings: { chargingOnly: checked } })} />
            <CpuLimitSlider value={state.settings.cpuLimit} onChange={(value) => dispatch({ type: "UPDATE_SETTINGS", settings: { cpuLimit: value } })} />
            <SettingToggleRow title="Auto-accept trusted job" description="Let the scheduler queue the next single job when availability is active." checked={state.settings.autoAcceptJobs} onCheckedChange={(checked) => dispatch({ type: "UPDATE_SETTINGS", settings: { autoAcceptJobs: checked } })} />
            <SettingToggleRow title="Allow background running" description="Keep earning while the command center is minimized." checked={state.settings.backgroundRunning} onCheckedChange={(checked) => dispatch({ type: "UPDATE_SETTINGS", settings: { backgroundRunning: checked } })} />
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-200" />
              <p className="text-sm font-semibold text-white">Current contract</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              One provider account, one registered machine, one active job at a time. The latest output summary stays visible until a new assignment replaces it.
            </p>
          </div>

          <Button className="mt-5 h-12 w-full bg-rose-300 text-zinc-950 hover:bg-rose-200" onClick={() => dispatch({ type: "EMERGENCY_STOP" })}>
            <ShieldAlert className="mr-2 h-4 w-4" />
            Emergency stop and disconnect
          </Button>
        </section>

        <TrustSafetyCard />
      </div>
    </AppShell>
  );
}
