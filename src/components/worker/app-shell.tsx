"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Gauge,
  HardDrive,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  WalletCards
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TopStatusBar } from "@/src/components/worker/top-status-bar";
import { useWorker } from "@/src/hooks/use-worker";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: HardDrive },
  { href: "/earnings", label: "Earnings", icon: WalletCards },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  const pathname = usePathname();
  const { state } = useWorker();
  const basePath = pathname?.startsWith("/provider") ? "/provider" : "";
  const activeNavLabel = navItems.find((item) => `${basePath}${item.href}` === pathname)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen overflow-hidden bg-[#07111a] text-zinc-100">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_26%),radial-gradient(circle_at_85%_18%,rgba(56,189,248,0.16),transparent_24%),linear-gradient(135deg,#07111a_0%,#0b1623_52%,#111827_100%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(7,17,26,0.16)_48%,rgba(3,7,18,0.62)_100%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-[318px] shrink-0 border-r border-white/10 bg-slate-950/40 px-5 py-6 backdrop-blur-2xl xl:block">
          <Link
            href={`${basePath}/dashboard`}
            className="group flex items-center gap-4 rounded-[28px] border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-cyan-200 to-blue-200 text-slate-950 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.02em] text-white">ComputeBNB</p>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/65">Provider Control</p>
            </div>
          </Link>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-gradient-to-br from-emerald-300/15 via-cyan-300/10 to-transparent p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-100/85">Machine state</p>
              <Sparkles className="h-4 w-4 text-cyan-100/75" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{state.machine.status}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {state.availability === "active"
                ? state.activeJob
                  ? "Your node is online and processing one verified job."
                  : "Your node is armed and waiting for the next verified assignment."
                : "Your node is registered locally and currently not taking new work."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Today</p>
                <p className="mt-2 text-lg font-semibold text-white">${state.earnings.today.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Latency</p>
                <p className="mt-2 text-lg font-semibold text-white">{state.metrics.heartbeatLatencyMs || 0}ms</p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const href = `${basePath}${item.href}`;
              const active = pathname === href;
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                    active
                      ? "border-cyan-200/30 bg-white text-slate-950 shadow-[0_18px_45px_rgba(255,255,255,0.14)]"
                      : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[28px] border border-emerald-300/15 bg-emerald-300/10 p-5">
            <div className="flex items-center gap-2 text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold">Trust controls on</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Workloads run in a restricted sandbox. Your files, keys, camera, and microphone stay off-limits.
            </p>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">Lifetime</p>
              <BarChart3 className="h-4 w-4 text-cyan-200" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">${state.earnings.lifetime.toFixed(2)}</p>
            <p className="mt-1 text-xs text-slate-400">{state.earnings.completedJobs} completed jobs on this machine</p>
          </div>
        </aside>

        <main className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1540px]">
            <header className="mb-6 rounded-[32px] border border-white/10 bg-slate-950/35 px-5 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/80">{eyebrow}</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                    One machine, one trusted job at a time. This surface keeps availability, thermals, output, and payout state in one place.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-200">
                    <span className="block text-[11px] uppercase tracking-[0.22em] text-slate-400">Focus</span>
                    <span className="mt-1 block font-medium text-white">{activeNavLabel}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-200">
                    <span className="block text-[11px] uppercase tracking-[0.22em] text-slate-400">Machine</span>
                    <span className="mt-1 block font-medium text-white">{state.machine.name}</span>
                  </div>
                  <Link
                    href={`${basePath}/settings`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
                  >
                    Tune limits
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="mt-5">
                <TopStatusBar state={state} />
              </div>
            </header>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
