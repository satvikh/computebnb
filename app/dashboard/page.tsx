"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wordmark,
  MachineGrid,
  Sparkline,
  StatusPill,
  ThemeNav,
  useTick
} from "../_components/chrome";

type MachineRow = {
  name: string;
  host: string;
  hw: string;
  status: "running" | "live" | "idle";
  load: number;
  today: number;
  job: string;
  today24: number[];
};

const MACHINES: MachineRow[] = [
  {
    name: "mbp-oakland-04",
    host: "priya · us-west",
    hw: "M2 Max · 32G",
    status: "running",
    load: 0.72,
    today: 4.12,
    job: "llama-3.1-8b · inf · 412/1k",
    today24: [0.1, 0.3, 0.2, 0.4, 0.6, 0.8, 1.2, 1.4, 1.8, 2.2, 2.8, 3.4, 3.9, 4.12]
  },
  {
    name: "rtx-sf-33",
    host: "priya · us-west",
    hw: "RTX 4070 · 12G",
    status: "live",
    load: 0.08,
    today: 2.84,
    job: "— idle · listening —",
    today24: [0.2, 0.4, 0.6, 0.8, 1.1, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 2.84]
  },
  {
    name: "m1-air-home-19",
    host: "priya · us-west",
    hw: "M1 Air · 8G",
    status: "idle",
    load: 0,
    today: 0,
    job: "— paused by user · 3h ago",
    today24: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
];

type KPI = {
  k: string;
  v: string;
  sub: string;
  spark: number[] | null;
  ok: boolean | null;
};
const KPIS: KPI[] = [
  {
    k: "EARNINGS · 7D",
    v: "$47.82",
    sub: "+18.4% vs prior",
    spark: [10, 12, 11, 14, 13, 16, 18, 17, 20, 22, 24, 26],
    ok: true
  },
  {
    k: "JOBS COMPLETED",
    v: "1,284",
    sub: "99.2% success",
    spark: [22, 24, 21, 28, 25, 30, 29, 32, 34, 36, 38, 42],
    ok: true
  },
  {
    k: "UTILIZATION",
    v: "62.4%",
    sub: "· 14h idle today",
    spark: [40, 55, 60, 70, 58, 48, 52, 60, 64, 62, 58, 62],
    ok: false
  },
  {
    k: "AVG MATCH",
    v: "2.1s",
    sub: "· p95 4.8s",
    spark: [3, 2.5, 2.8, 2.1, 2.4, 2.2, 1.9, 2.1, 2.0, 2.1, 2.3, 2.1],
    ok: true
  },
  {
    k: "NEXT PAYOUT",
    v: "Mar 15",
    sub: "→ chase •• 4281",
    spark: null,
    ok: null
  }
];

type StackedBar = { d: string; stack: number[]; current?: boolean };
const WEEK: StackedBar[] = [
  { d: "M 08", stack: [3.2, 1.1, 0.8, 0.4] },
  { d: "T 09", stack: [4.1, 1.4, 0.6, 0.7] },
  { d: "W 10", stack: [3.8, 1.2, 1.0, 0.5] },
  { d: "T 11", stack: [5.2, 1.8, 0.9, 0.8] },
  { d: "F 12", stack: [4.6, 1.5, 1.2, 0.6] },
  { d: "S 13", stack: [6.8, 2.1, 1.4, 1.0] },
  { d: "S 14", stack: [2.8, 0.9, 0.3, 0.12], current: true }
];

type JobRow = {
  s: "running" | "live" | "error";
  id: string;
  model: string;
  who: string;
  prog: number;
  earn: number;
};
const JOBS: JobRow[] = [
  { s: "running", id: "job_01HZK8", model: "llama-3.1-8b", who: "acme-labs", prog: 41, earn: 0.019 },
  { s: "running", id: "job_01HZK7", model: "bge-small-en", who: "levain", prog: 88, earn: 0.004 },
  { s: "live", id: "job_01HZK6", model: "whisper-v3", who: "pod-inc", prog: 100, earn: 0.034 },
  { s: "live", id: "job_01HZK5", model: "sdxl-turbo", who: "makerly", prog: 100, earn: 0.012 },
  { s: "live", id: "job_01HZK4", model: "e5-large-v2", who: "rag-co", prog: 100, earn: 0.007 },
  { s: "error", id: "job_01HZK3", model: "mistral-7b", who: "side-ai", prog: 12, earn: 0 },
  { s: "live", id: "job_01HZK2", model: "flux-schnell", who: "cv-games", prog: 100, earn: 0.028 },
  { s: "live", id: "job_01HZK1", model: "parakeet", who: "jot-app", prog: 100, earn: 0.006 }
];

type ActivityRow = {
  t: string;
  m: string;
  e: string;
  k: "run" | "ok" | "info" | "err";
  v: string;
};
const ACTIVITY: ActivityRow[] = [
  { t: "22:14:21", m: "mbp-oakland-04", e: "llama-3.1-8b · 412 tok streamed", k: "run", v: "+$0.019" },
  { t: "22:14:18", m: "rtx-sf-33", e: "bge-small · 2.1k embeds completed", k: "ok", v: "+$0.004" },
  { t: "22:13:58", m: "mbp-oakland-04", e: "llama-3.1-8b · job_01HZK8 accepted", k: "ok", v: "" },
  { t: "22:13:42", m: "rtx-sf-33", e: "reputation → ★ 4.97 (was 4.96)", k: "info", v: "" },
  { t: "22:13:11", m: "mbp-oakland-04", e: "whisper-v3 · 3m audio transcribed", k: "ok", v: "+$0.034" },
  { t: "22:12:48", m: "rtx-sf-33", e: "sdxl-turbo · 4 images generated", k: "ok", v: "+$0.012" },
  { t: "22:11:30", m: "mbp-oakland-04", e: "model cache warm · llama-3.1-8b", k: "info", v: "" },
  { t: "22:10:14", m: "mbp-oakland-04", e: "mistral-7b · tokenizer OOM · retried", k: "err", v: "—" },
  { t: "22:09:02", m: "rtx-sf-33", e: "flux-schnell · 1024px", k: "ok", v: "+$0.028" },
  { t: "22:07:45", m: "m1-air-home-19", e: "machine paused by user", k: "info", v: "" },
  { t: "22:06:18", m: "rtx-sf-33", e: "parakeet · 2m audio", k: "ok", v: "+$0.006" }
];

const NAV = ["Overview", "Machines", "Jobs", "Earnings", "Activity", "Settings"];

export default function Theme0Dashboard() {
  const tick = useTick(2000);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1440,
        minHeight: 1024,
        margin: "0 auto",
        background: "var(--paper)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* ── top bar ── */}
      <div
        style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          alignItems: "center",
          gap: 24,
          background: "var(--paper)"
        }}
      >
        <Link href="/">
          <Wordmark size={18} />
        </Link>
        <div
          style={{ width: 1, height: 20, background: "var(--rule-soft)" }}
        />
        <div
          style={{
            display: "flex",
            gap: 2,
            fontSize: 12,
            fontFamily: "var(--font-mono)"
          }}
        >
          {NAV.map((t, i) => (
            <span
              key={t}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                background: i === 0 ? "var(--ink)" : "transparent",
                color: i === 0 ? "var(--paper)" : "var(--ink-2)",
                borderRadius: 2
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={{
            marginLeft: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            border: "1px solid var(--rule-soft)",
            borderRadius: 2,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-3)",
            width: 280
          }}
        >
          <span>⌕</span>
          <span>Search jobs, machines, invoices…</span>
          <span className="kbd" style={{ marginLeft: "auto" }}>
            ⌘K
          </span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 12
          }}
        >
          <span className="mono" style={{ color: "var(--ink-3)" }}>
            <span
              className="dot live animated"
              style={{ marginRight: 6 }}
            />
            3 machines · 2 live
          </span>
          <span
            style={{ width: 1, height: 18, background: "var(--rule-soft)" }}
          />
          <span className="mono" style={{ color: "var(--ink-3)" }}>
            Balance
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 15,
              fontWeight: 500
            }}
          >
            $284.60
          </span>
          <button
            style={{
              padding: "6px 12px",
              background: "var(--live)",
              color: "var(--live-ink)",
              border: "none",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 2,
              cursor: "pointer"
            }}
          >
            Withdraw
          </button>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "var(--paper)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 500
            }}
          >
            PB
          </div>
        </div>
      </div>

      {/* ── page header ── */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--rule-soft)",
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between"
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            § Overview · Mar 14, 2026 · 22:14 PT
          </div>
          <h1
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 32,
              letterSpacing: -0.02 * 32,
              margin: 0,
              lineHeight: 1
            }}
          >
            Good evening, Priya.
            <span
              className="serif"
              style={{ fontSize: 32, color: "var(--ink-3)" }}
            >
              {" "}
              Your fleet earned
            </span>
            <span> $4.12</span>
            <span
              className="serif"
              style={{ fontSize: 32, color: "var(--ink-3)" }}
            >
              {" "}
              today.
            </span>
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 11
          }}
        >
          {["24h", "7d", "30d", "all"].map((r, i) => (
            <span
              key={r}
              style={{
                padding: "6px 12px",
                border: "1px solid var(--rule-soft)",
                background: i === 1 ? "var(--ink)" : "var(--paper)",
                color: i === 1 ? "var(--paper)" : "var(--ink-2)",
                cursor: "pointer",
                borderRadius: 2
              }}
            >
              {r}
            </span>
          ))}
          <span
            style={{
              padding: "6px 12px",
              border: "1px solid var(--rule-soft)",
              borderRadius: 2,
              color: "var(--ink-2)"
            }}
          >
            ↓ Export
          </span>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          borderBottom: "1px solid var(--rule)",
          background: "var(--paper)"
        }}
      >
        {KPIS.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "20px 24px",
              borderRight:
                i < 4 ? "1px solid var(--rule-soft)" : "none"
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: 0.08
              }}
            >
              {m.k}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                marginTop: 6
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 32,
                  fontWeight: 500,
                  letterSpacing: -0.025 * 32,
                  lineHeight: 1
                }}
              >
                {m.v}
              </span>
              {m.spark && (
                <Sparkline
                  data={m.spark}
                  width={70}
                  height={22}
                  stroke={m.ok ? "var(--ink)" : "var(--running)"}
                  fill={
                    m.ok
                      ? "rgba(201,242,59,0.3)"
                      : "rgba(230,106,44,0.15)"
                  }
                />
              )}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color:
                  m.ok === false ? "var(--running)" : "var(--ink-3)",
                marginTop: 4
              }}
            >
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── body grid ── */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 440px",
          minHeight: 0
        }}
      >
        {/* main column */}
        <div
          style={{
            borderRight: "1px solid var(--rule-soft)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0
          }}
        >
          {/* machines table */}
          <div
            style={{
              padding: "20px 24px 8px",
              borderBottom: "1px solid var(--rule-soft)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12
              }}
            >
              <div className="eyebrow">My machines · 3</div>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-3)"
                }}
              >
                <span>
                  <span className="dot live" /> live 2
                </span>
                <span>
                  <span className="dot running" /> running 1
                </span>
                <span>
                  <span className="dot idle" /> paused 1
                </span>
                <span
                  style={{
                    color: "var(--ink)",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    cursor: "pointer"
                  }}
                >
                  + add machine
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "24px 1.4fr 1fr 90px 90px 110px 1.3fr 110px",
                padding: "8px 0",
                borderBottom: "1px solid var(--rule)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: 0.06,
                textTransform: "uppercase"
              }}
            >
              <span />
              <span>Machine</span>
              <span>Hardware</span>
              <span>Status</span>
              <span>Load</span>
              <span>Today</span>
              <span>Current job</span>
              <span style={{ textAlign: "right" }}>24h</span>
            </div>

            {MACHINES.map((m, i) => (
              <div
                key={m.name}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "24px 1.4fr 1fr 90px 90px 110px 1.3fr 110px",
                  padding: "12px 0",
                  borderBottom:
                    i < MACHINES.length - 1
                      ? "1px dashed var(--rule-soft)"
                      : "none",
                  alignItems: "center",
                  fontSize: 13
                }}
              >
                <span>
                  <span
                    className={`dot ${m.status} ${
                      m.status === "live" ? "animated" : ""
                    }`}
                  />
                </span>
                <span>
                  <div
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 500
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: "var(--ink-3)" }}
                  >
                    {m.host}
                  </div>
                </span>
                <span className="mono" style={{ fontSize: 12 }}>
                  {m.hw}
                </span>
                <span>
                  <StatusPill state={m.status}>
                    {m.status === "running"
                      ? "RUNNING"
                      : m.status === "live"
                        ? "LIVE"
                        : "PAUSED"}
                  </StatusPill>
                </span>
                <span style={{ paddingRight: 14 }}>
                  <div style={{ height: 4, background: "var(--paper-3)" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${m.load * 100}%`,
                        background:
                          m.status === "running"
                            ? "var(--running)"
                            : m.status === "live"
                              ? "var(--live)"
                              : "var(--ink-4)"
                      }}
                    />
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--ink-3)",
                      marginTop: 2
                    }}
                  >
                    {Math.round(m.load * 100)}% cpu
                  </div>
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  ${m.today.toFixed(2)}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color:
                      m.status === "idle"
                        ? "var(--ink-4)"
                        : "var(--ink-2)"
                  }}
                >
                  {m.status === "running" && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 36,
                        marginRight: 8,
                        background: "var(--paper-3)",
                        height: 3,
                        verticalAlign: "middle",
                        position: "relative"
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: "41%",
                          background: "var(--running)"
                        }}
                      />
                    </span>
                  )}
                  {m.job}
                </span>
                <span style={{ textAlign: "right" }}>
                  <Sparkline
                    data={
                      m.today24.length > 1 ? m.today24 : [0, 0]
                    }
                    width={96}
                    height={22}
                    stroke={
                      m.status === "idle" ? "var(--ink-4)" : "var(--ink)"
                    }
                    fill={
                      m.status === "idle"
                        ? "none"
                        : "rgba(201,242,59,0.3)"
                    }
                  />
                </span>
              </div>
            ))}
          </div>

          {/* earnings + jobs split */}
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr",
              minHeight: 0
            }}
          >
            {/* earnings chart */}
            <div
              style={{
                padding: "20px 24px",
                borderRight: "1px solid var(--rule-soft)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16
                }}
              >
                <div className="eyebrow">Earnings · 7 days</div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--ink-3)"
                  }}
                >
                  {[
                    ["var(--running)", "inference"],
                    ["var(--live)", "embeddings"],
                    ["var(--warming)", "transcribe"],
                    ["var(--ink)", "image"]
                  ].map(([c, l]) => (
                    <span key={l}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          background: c,
                          marginRight: 6
                        }}
                      />
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-end",
                  paddingBottom: 24,
                  position: "relative",
                  minHeight: 240
                }}
              >
                {WEEK.map((b, i) => {
                  const total = b.stack.reduce((a, c) => a + c, 0);
                  const max = 12;
                  const h = (total / max) * 100;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <span className="mono" style={{ fontSize: 11 }}>
                        ${total.toFixed(2)}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          height: `${h * 2.4}px`,
                          display: "flex",
                          flexDirection: "column-reverse",
                          position: "relative"
                        }}
                      >
                        <div
                          style={{
                            height: `${(b.stack[0] / total) * 100}%`,
                            background: "var(--running)"
                          }}
                        />
                        <div
                          style={{
                            height: `${(b.stack[1] / total) * 100}%`,
                            background: "var(--live)"
                          }}
                        />
                        <div
                          style={{
                            height: `${(b.stack[2] / total) * 100}%`,
                            background: "var(--warming)"
                          }}
                        />
                        <div
                          style={{
                            height: `${(b.stack[3] / total) * 100}%`,
                            background: "var(--ink)"
                          }}
                        />
                        {b.current && (
                          <div
                            style={{
                              position: "absolute",
                              top: -14,
                              left: "50%",
                              transform: "translateX(-50%)",
                              padding: "1px 4px",
                              background: "var(--ink)",
                              color: "var(--paper)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 9,
                              whiteSpace: "nowrap"
                            }}
                          >
                            TODAY
                          </div>
                        )}
                      </div>
                      <span
                        className="mono"
                        style={{ fontSize: 10, color: "var(--ink-3)" }}
                      >
                        {b.d}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  paddingTop: 16,
                  borderTop: "1px solid var(--rule-soft)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11
                }}
              >
                <span style={{ color: "var(--ink-3)" }}>WEEK TOTAL</span>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: -0.02 * 18
                  }}
                >
                  $47.82{" "}
                  <span
                    style={{
                      color: "var(--ink-3)",
                      fontSize: 12,
                      fontWeight: 400
                    }}
                  >
                    · 312 jobs · avg $0.153
                  </span>
                </span>
              </div>
            </div>

            {/* jobs table */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12
                }}
              >
                <div className="eyebrow">
                  Recent jobs · running on your machines
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  <a
                    style={{
                      textDecoration: "underline",
                      textUnderlineOffset: 3
                    }}
                  >
                    view all →
                  </a>
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 60px 60px",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--rule)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--ink-3)",
                  letterSpacing: 0.06,
                  textTransform: "uppercase"
                }}
              >
                <span>Status</span>
                <span>Job</span>
                <span style={{ textAlign: "right" }}>Prog</span>
                <span style={{ textAlign: "right" }}>Earn</span>
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                {JOBS.map((j, i) => (
                  <div
                    key={j.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 60px 60px",
                      padding: "9px 0",
                      borderBottom:
                        i < JOBS.length - 1
                          ? "1px dashed var(--rule-soft)"
                          : "none",
                      alignItems: "center",
                      fontSize: 12
                    }}
                  >
                    <span>
                      <StatusPill state={j.s}>
                        {j.s === "running"
                          ? "RUN"
                          : j.s === "live"
                            ? "OK"
                            : "ERR"}
                      </StatusPill>
                    </span>
                    <span>
                      <div className="mono" style={{ fontSize: 11 }}>
                        {j.model}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: 10, color: "var(--ink-3)" }}
                      >
                        {j.id} · {j.who}
                      </div>
                    </span>
                    <span style={{ textAlign: "right" }}>
                      <div
                        className="mono"
                        style={{ fontSize: 10, color: "var(--ink-3)" }}
                      >
                        {j.prog}%
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: "var(--paper-3)",
                          marginTop: 3
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${j.prog}%`,
                            background:
                              j.s === "error"
                                ? "var(--error)"
                                : j.s === "running"
                                  ? "var(--running)"
                                  : "var(--live)"
                          }}
                        />
                      </div>
                    </span>
                    <span
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color:
                          j.s === "error" ? "var(--ink-4)" : "var(--ink)"
                      }}
                    >
                      {j.s === "error" ? "—" : `+$${j.earn.toFixed(3)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* right column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0
          }}
        >
          {/* network availability */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--rule-soft)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12
              }}
            >
              <div className="eyebrow">
                <span
                  className="dot live animated"
                  style={{ marginRight: 8 }}
                />
                Network availability
              </div>
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--ink-3)" }}
              >
                us-west · live
              </span>
            </div>
            <MachineGrid
              rows={6}
              cols={24}
              seed={tick + 2}
              running={0.18}
              warming={0.05}
              live={0.42}
            />
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
                fontFamily: "var(--font-mono)",
                fontSize: 11
              }}
            >
              {[
                ["LIVE", "168", "59%"],
                ["RUN", "70", "25%"],
                ["WARM", "18", "6%"],
                ["IDLE", "32", "10%"]
              ].map(([k, v, p]) => (
                <div key={k}>
                  <div style={{ color: "var(--ink-3)", fontSize: 10 }}>
                    {k}
                  </div>
                  <div>
                    {v} <span style={{ color: "var(--ink-3)" }}>{p}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* activity feed */}
          <div
            style={{
              padding: "20px 24px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              borderBottom: "1px solid var(--rule-soft)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12
              }}
            >
              <div className="eyebrow">Activity · your fleet</div>
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--ink-3)" }}
              >
                auto-refresh · 2s
              </span>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                fontFamily: "var(--font-mono)",
                fontSize: 11
              }}
            >
              {ACTIVITY.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 56px",
                    gap: 8,
                    padding: "6px 0",
                    alignItems: "start",
                    borderBottom: "1px dashed var(--rule-soft)"
                  }}
                >
                  <span style={{ color: "var(--ink-3)" }}>{r.t}</span>
                  <span>
                    <div style={{ color: "var(--ink)" }}>
                      <span
                        className={`dot ${
                          r.k === "err"
                            ? "error"
                            : r.k === "run"
                              ? "running"
                              : r.k === "info"
                                ? "idle"
                                : "live"
                        }`}
                        style={{ marginRight: 6 }}
                      />
                      {r.e}
                    </div>
                    <div
                      style={{
                        color: "var(--ink-4)",
                        fontSize: 10,
                        marginLeft: 13
                      }}
                    >
                      {r.m}
                    </div>
                  </span>
                  <span
                    style={{
                      textAlign: "right",
                      color: r.v.startsWith("+")
                        ? "var(--ink)"
                        : "var(--ink-4)"
                    }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* payout teaser */}
          <div
            style={{
              padding: "20px 24px",
              background: "var(--ink)",
              color: "var(--paper)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div
                  className="eyebrow"
                  style={{ color: "rgba(244,241,234,0.5)" }}
                >
                  NEXT PAYOUT · 16H 42M
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    marginTop: 8
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: 34,
                      fontWeight: 500,
                      letterSpacing: -0.025 * 34,
                      lineHeight: 1
                    }}
                  >
                    $284
                    <span style={{ color: "rgba(244,241,234,0.5)" }}>
                      .60
                    </span>
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "rgba(244,241,234,0.6)"
                    }}
                  >
                    → chase •• 4281
                  </span>
                </div>
              </div>
              <button
                style={{
                  padding: "10px 14px",
                  background: "var(--live)",
                  color: "var(--live-ink)",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 2,
                  cursor: "pointer"
                }}
              >
                Withdraw now
              </button>
            </div>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 2,
                height: 4
              }}
            >
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: "100%",
                    background:
                      i < 32
                        ? "var(--live)"
                        : "rgba(244,241,234,0.15)"
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "rgba(244,241,234,0.5)"
              }}
            >
              <span>last payout: Mar 14 · $198.30</span>
              <span>settles daily 06:00 UTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* status bar */}
      <div
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "6px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink-3)",
          background: "var(--paper-2)"
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          <span>
            <span
              className="dot live animated"
              style={{ marginRight: 6 }}
            />
            daemon v0.8.4
          </span>
          <span>edge-sfo · 12ms</span>
          <span>2 connections encrypted</span>
          <span>cpu 38% · mem 2.1G / 32G</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <span>logs</span>
          <span>docs</span>
          <span>⌘K commands</span>
        </div>
      </div>

      <ThemeNav page="dashboard" />
    </div>
  );
}
