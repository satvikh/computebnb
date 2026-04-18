"use client";

import * as React from "react";
import Link from "next/link";

// ── Wordmark ──────────────────────────────────────────────────────────
export function Wordmark({
  size = 18,
  color = "var(--ink)"
}: {
  size?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0,
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: -0.02 * size,
        color,
        lineHeight: 1
      }}
    >
      <span>GPU</span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: size * 1.05,
          marginLeft: size * 0.02
        }}
      >
        bnb
      </span>
      <span
        style={{
          display: "inline-block",
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: "50%",
          background: "var(--live)",
          marginLeft: size * 0.18,
          alignSelf: "center",
          boxShadow: "0 0 0 2px rgba(201,242,59,0.25)"
        }}
      />
    </span>
  );
}

// ── MachineGrid ───────────────────────────────────────────────────────
export function MachineGrid({
  rows = 8,
  cols = 24,
  seed = 1,
  running = 0.18,
  warming = 0.06,
  live = 0.35,
  inv = false
}: {
  rows?: number;
  cols?: number;
  seed?: number;
  running?: number;
  warming?: number;
  live?: number;
  inv?: boolean;
}) {
  const cells = React.useMemo(() => {
    let s = seed || 1;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const out: string[] = [];
    for (let i = 0; i < rows * cols; i++) {
      const r = rand();
      if (r < running) out.push("run");
      else if (r < running + warming) out.push("warm");
      else if (r < running + warming + live) out.push("on");
      else out.push("off");
    }
    return out;
  }, [rows, cols, seed, running, warming, live]);

  return (
    <div
      className={`mgrid${inv ? " inv" : ""}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {cells.map((c, i) => (
        <div key={i} className={`cell ${c}`} />
      ))}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────
export function Sparkline({
  data,
  width = 120,
  height = 28,
  stroke = "var(--ink)",
  fill = "none"
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - ((d - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M${pts.join(" L")}`;
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill !== "none" && <path d={area} fill={fill} />}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── StatusPill ────────────────────────────────────────────────────────
export type PillState =
  | "live"
  | "running"
  | "warming"
  | "idle"
  | "error"
  | "ok"
  | "run";

export function StatusPill({
  state = "live",
  children
}: {
  state?: PillState;
  children: React.ReactNode;
}) {
  const s = state === "ok" ? "live" : state === "run" ? "running" : state;
  const bg: Record<string, string> = {
    live: "var(--live)",
    running: "var(--running)",
    warming: "var(--warming)",
    idle: "var(--paper-3)",
    error: "var(--error)"
  };
  const fg =
    s === "live" ? "var(--live-ink)" : s === "idle" ? "var(--ink-2)" : "#fff";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 7px 2px 6px",
        borderRadius: 2,
        background: bg[s] ?? "var(--paper-3)",
        color: fg,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: 0.02,
        textTransform: "uppercase",
        fontWeight: 500
      }}
    >
      {children}
    </span>
  );
}

// ── useTick — drives the "live" oscillations. Client-only; skips
// initial render so SSR markup matches the first client paint.
export function useTick(ms = 2200) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

// ── ThemeNav — floating switcher between the three main screens
export function ThemeNav({
  page
}: {
  page: "landing" | "login" | "dashboard";
}) {
  const items: Array<[typeof page, string, string]> = [
    ["landing", "Landing", "/"],
    ["login", "Onboarding", "/login"],
    ["dashboard", "Dashboard", "/dashboard"]
  ];
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 4,
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        borderRadius: 2,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        boxShadow: "0 8px 24px -12px rgba(0,0,0,0.25)"
      }}
    >
      <span
        style={{
          padding: "4px 8px",
          color: "var(--ink-3)",
          letterSpacing: 0.08,
          textTransform: "uppercase"
        }}
      >
        gpubnb ·
      </span>
      {items.map(([slug, label, href]) => (
        <Link
          key={slug}
          href={href}
          style={{
            padding: "4px 10px",
            borderRadius: 2,
            background: page === slug ? "var(--ink)" : "transparent",
            color: page === slug ? "var(--paper)" : "var(--ink-2)"
          }}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
