"use client";

import { BatteryCharging, Cpu, HardDrive, RadioTower, Thermometer, Wifi } from "lucide-react";
import { MetricTile } from "@/src/components/worker/metric-tile";
import type { WorkerState } from "@/src/types/worker";

export function ResourceUsageCard({ state }: { state: WorkerState }) {
  const hasThermalReading = state.metrics.temperatureC > 0;
  const hasNetworkReading = state.metrics.networkMbps > 0;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Machine health</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Resource envelope</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricTile icon={Cpu} label="CPU" value={`${state.metrics.cpuUsage.toFixed(0)}%`} detail={`${state.machine.cpuLimit}% owner cap`} progress={state.metrics.cpuUsage} />
        <MetricTile icon={HardDrive} label="Memory" value={`${state.metrics.memoryUsage.toFixed(0)}%`} detail={`${state.machine.memoryGb} GB detected`} progress={state.metrics.memoryUsage} tone="cool" />
        <MetricTile icon={BatteryCharging} label="Battery" value={`${state.metrics.batteryPercent.toFixed(0)}%`} detail={state.machine.charging ? "Charging-only rule satisfied" : "Running on battery"} progress={state.metrics.batteryPercent} />
        <MetricTile icon={Thermometer} label="Thermals" value={hasThermalReading ? `${state.metrics.temperatureC.toFixed(0)} C` : "Unavailable"} detail={hasThermalReading ? "Host sensor reading" : "No temperature sensor exposed"} progress={hasThermalReading ? (state.metrics.temperatureC / 90) * 100 : 0} tone="warm" />
        <MetricTile icon={Wifi} label="Network" value={hasNetworkReading ? `${state.metrics.networkMbps.toFixed(0)} Mbps` : "Unavailable"} detail={hasNetworkReading ? "Measured interface throughput" : "No bandwidth probe running"} progress={hasNetworkReading ? Math.min(100, state.metrics.networkMbps / 2) : 0} tone="cool" />
        <MetricTile icon={RadioTower} label="Heartbeat" value={`${state.metrics.heartbeatLatencyMs || 0}ms`} detail={state.metrics.heartbeatLatencyMs ? "Local scheduler loop" : "Worker is stopped"} progress={state.metrics.heartbeatLatencyMs ? 100 - state.metrics.heartbeatLatencyMs : 0} />
      </div>
    </section>
  );
}
