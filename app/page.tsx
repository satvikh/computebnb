"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const networkCells = [
  "off","off","live","live","run","off","live","off","run","live","live","off","off","run","off","off","live","run","off","off","live","run","off","off",
  "off","off","live","run","live","off","off","live","off","off","run","live","off","live","run","off","off","live","off","off","run","live","live","off",
  "live","live","off","off","live","run","off","live","off","run","off","off","live","off","off","run","live","off","live","off","off","off","run","off",
  "run","off","off","live","off","off","run","off","live","off","live","run","off","off","live","off","run","off","off","live","off","off","live","off",
  "off","live","run","off","off","live","off","off","run","live","off","off","run","off","off","live","off","run","off","live","off","run","off","off",
  "live","off","off","run","live","off","live","off","off","off","run","live","off","off","live","off","live","off","off","run","live","off","live","off",
  "off","run","live","off","off","run","off","live","off","off","live","off","run","off","live","off","off","live","run","off","off","live","off","run",
  "live","off","off","live","run","off","off","live","off","run","off","off","live","run","off","off","live","off","off","run","live","off","off","live",
  "off","live","off","off","live","run","off","off","live","off","run","live","off","off","run","off","off","live","off","run","off","live","off","off",
  "run","off","live","off","off","live","off","run","off","off","live","off","off","run","live","off","off","live","off","off","run","live","off","live"
];

const workloadCards = [
  { label: "Workload / 01", title: "Inference", model: "Llama • mistral • qwen", price: "$0.003", unit: "/ 1k tok" },
  { label: "Workload / 02", title: "Embeddings", model: "bge • e5 • nomic", price: "$0.001", unit: "/ 1k tok" },
  { label: "Workload / 03", title: "Transcribe", model: "whisper • parakeet", price: "$0.008", unit: "/ min" },
  { label: "Workload / 04", title: "Image gen", model: "sdxl-turbo • flux-s", price: "$0.012", unit: "/ image" }
];

const matches = [
  { time: "22:14:08", job: "llama-3.1-8b", host: "mbp-oakland-64", value: "$0.019" },
  { time: "22:14:06", job: "whisper-v3", host: "rtx-3090-leipzig", value: "$0.034" },
  { time: "22:14:03", job: "sdxl-turbo", host: "m2-ultra-tokyo", value: "$0.012" },
  { time: "22:13:59", job: "embed-3", host: "mbp-portland-12", value: "$0.007" }
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <main
      className="gpu-root min-h-screen bg-[#f4f1ea] text-[#141410]"
      onClick={() => router.push("/login")}
      role="presentation"
    >
      <section className="border-b border-black/70 bg-[#171611] text-[#f4f1ea]">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 overflow-hidden px-5 py-2 text-[10px] uppercase tracking-[0.18em] sm:text-[11px]">
          <div className="flex items-center gap-2 whitespace-nowrap text-[#d4f542]">
            <span className="dot live animated" />
            Live
          </div>
          <span className="text-white/55">//</span>
          <span className="whitespace-nowrap">2,847 machines online</span>
          <span className="text-white/55">//</span>
          <span className="whitespace-nowrap">412 jobs running</span>
          <span className="text-white/55">//</span>
          <span className="whitespace-nowrap">$18,482 paid to providers this week</span>
          <span className="text-white/55">//</span>
          <span className="whitespace-nowrap">Avg. wait 2.1s</span>
          <span className="ml-auto whitespace-nowrap text-white/45">network status: nominal</span>
        </div>
      </section>

      <header className="border-b border-black/20 bg-[#ece8dd]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4">
          <div className="flex items-center gap-10">
            <Link href="/login" className="text-[31px] font-semibold leading-none tracking-[-0.06em]">
              GPU<span className="text-[#b7df2a]">bnb</span>
            </Link>
            <nav className="hidden items-center gap-7 text-[13px] text-black/70 md:flex">
              <Link href="/login">How it works</Link>
              <Link href="/login">For providers</Link>
              <Link href="/login">For developers</Link>
              <Link href="/login">Pricing</Link>
              <Link href="/login">Docs</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-2 text-[13px] font-medium text-black/80">
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-black bg-[#171611] px-4 py-2 text-[13px] font-medium text-[#f4f1ea]"
            >
              Start earning <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-black/30">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12 lg:py-12">
          <div className="flex flex-col">
            <p className="eyebrow flex items-center gap-3">
              <span className="dot live" />
              GPU marketplace · est. 2025 · sf / remote
            </p>
            <h1 className="mt-7 max-w-[680px] text-[58px] font-semibold leading-[0.92] tracking-[-0.08em] text-black sm:text-[76px] lg:text-[84px]">
              Your laptop is
              <br />
              <span className="serif text-[0.86em] tracking-[-0.05em]">idle 71%</span> of the day.
            </h1>
            <p className="mt-8 max-w-[620px] text-[23px] leading-[1.28] tracking-[-0.03em] text-black/66">
              GPUbnb rents out that idle compute for lightweight AI jobs — and pays you every time it runs.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-[54px] items-center justify-center gap-2 border border-black bg-[#171611] px-6 text-[14px] font-semibold text-[#f4f1ea]"
              >
                List your machine <span className="mono text-[11px] opacity-70">$</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[54px] items-center justify-center border border-black bg-transparent px-6 text-[14px] font-medium"
              >
                Submit a job
              </Link>
              <Link href="/login" className="mono inline-flex items-center gap-2 px-2 text-[11px] uppercase tracking-[0.16em] text-black/42">
                or <span className="border border-black/15 bg-white/40 px-3 py-2">curl -s gpubnb.sh | sh</span>
              </Link>
            </div>

            <Link
              href="/login"
              className="mt-10 grid max-w-[730px] grid-cols-[1.1fr_1fr_auto] items-center gap-6 border border-black/45 px-5 py-4 text-left transition-colors hover:bg-black/[0.02]"
            >
              <div>
                <p className="eyebrow">Estimator</p>
                <p className="mt-3 text-[13px] text-black/60">M2 Max · 32GB · 12h/day idle</p>
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-[52px] font-semibold leading-none tracking-[-0.08em]">$127.40</span>
                  <span className="pb-1 text-[12px] text-black/50">+ $18</span>
                </div>
                <p className="mt-2 max-w-[260px] text-[12px] leading-5 text-black/52">
                  based on last 30d network demand · 18% of earnings to platform
                </p>
              </div>
              <div className="justify-self-end text-[13px] text-black/70">Tune →</div>
            </Link>
          </div>

          <Link
            href="/login"
            className="border border-black/85 bg-[#171611] p-5 text-[#f4f1ea] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center justify-between">
              <p className="eyebrow flex items-center gap-2 text-white/56">
                <span className="dot live animated" />
                network · last 60s
              </p>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-white/32">us-west · eu-w · ap-se</p>
            </div>

            <div className="mgrid inv mt-5">
              {networkCells.map((state, index) => (
                <span key={`${state}-${index}`} className={`cell ${state === "live" ? "on" : state}`} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3 border-t border-white/12 pt-4">
              <MetricStat label="Online" value="2,847" sub="machines" />
              <MetricStat label="Running" value="412" sub="jobs" />
              <MetricStat label="Queued" value="38" sub="jobs" />
              <MetricStat label="Throughput" value="1.4k" sub="tok/s avg" />
            </div>

            <div className="mt-5 border-t border-white/12 pt-4">
              <p className="eyebrow text-white/38">Recent matches</p>
              <div className="mt-3 space-y-2">
                {matches.map((item) => (
                  <div key={`${item.time}-${item.job}`} className="mono grid grid-cols-[70px_1fr_1fr_auto] gap-3 text-[11px] text-white/75">
                    <span className="text-white/34">{item.time}</span>
                    <span>{item.job}</span>
                    <span className="text-white/38">↔ {item.host}</span>
                    <span className="text-[#d4f542]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="border-b border-black/30 bg-[#f6f2e8]">
        <div className="mx-auto max-w-[1440px] px-5 py-10 lg:py-14">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <p className="eyebrow">$ 01 · How it works</p>
              <h2 className="mt-4 max-w-[700px] text-[48px] font-semibold leading-[0.94] tracking-[-0.07em] sm:text-[64px]">
                One sided marketplace,
                <br />
                <span className="serif text-[0.84em] tracking-[-0.04em]">two sided</span> economy.
              </h2>
            </div>
            <p className="max-w-[310px] text-right text-[13px] leading-5 text-black/52">
              Providers install a 4MB daemon. Jobs route via encrypted tunnel. Payouts settle daily to bank or wallet.
            </p>
          </div>

          <div className="mt-9 grid gap-0 border border-black/35 lg:grid-cols-3">
            <HowCard
              index="$ 01"
              title="Submit"
              body="A developer posts a job: model, inputs, budget ceiling, latency window. Jobs are priced in sub-cent units, billed per-token or per-second."
              footer={
                <pre className="mono whitespace-pre-wrap bg-[#161611] p-5 text-[11px] leading-5 text-[#edf1df]">
{`$ gpubnb submit \\
  --model llama-3.1-8b \\
  --in prompts.jsonl \\
  --max $0.40

> job_81H2K… queued`}
                </pre>
              }
            />
            <HowCard
              index="$ 02"
              title="Match"
              body="The scheduler matches jobs to machines by fit — VRAM, bandwidth, region, reputation. Matches settle in under two seconds."
              footer={
                <div className="mono bg-[#efebe1] p-5 text-[11px] leading-6 text-black/50">
                  <div>job_81H2K… matching…</div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-3 border-t border-black/8 pt-3">
                    <span>→ mbp-oakland-64</span>
                    <span>M2 Max · 32G</span>
                    <span>4.97 · 0.8s</span>
                    <span>→ rtx-leipzig-11</span>
                    <span>RTX 3090 · 24G</span>
                    <span>4.91 · 1.2s</span>
                    <span>→ i2-tokyo-22</span>
                    <span>H2 Ultra · 64G</span>
                    <span>4.99 · 2.1s</span>
                  </div>
                </div>
              }
            />
            <HowCard
              index="$ 03"
              title="Earn"
              body="Provider machine runs the job locally, streams results back. Earnings accrue in real time. Payouts every 24 hours."
              footer={
                <div className="bg-[#efebe1] p-5">
                  <div className="mono flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-black/34">
                    <span>Today · mbp-oakland-64</span>
                    <span>34.12 → $0.19</span>
                  </div>
                  <div className="relative mt-5 h-20 overflow-hidden border-t border-black/10 pt-3">
                    <svg viewBox="0 0 300 100" className="h-full w-full">
                      <path d="M0 80 L30 70 L60 76 L90 58 L120 66 L150 48 L180 55 L210 39 L240 28 L270 36 L300 18 L300 100 L0 100 Z" fill="rgba(201,242,59,0.35)" />
                      <path d="M0 80 L30 70 L60 76 L90 58 L120 66 L150 48 L180 55 L210 39 L240 28 L270 36 L300 18" fill="none" stroke="#1a1a13" strokeWidth="2" />
                    </svg>
                    <div className="mono absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-black/35">
                      <span>08:00</span>
                      <span>12:00</span>
                      <span>22:14</span>
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      <section className="border-b border-black/30 bg-[#f4f1ea]">
        <div className="mx-auto max-w-[1440px] px-5 py-10 lg:py-14">
          <p className="eyebrow">$ 03 · Workloads</p>
          <h2 className="mt-4 max-w-[940px] text-[48px] font-semibold leading-[0.95] tracking-[-0.07em] sm:text-[64px]">
            Built for the jobs that <span className="serif text-[0.82em] tracking-[-0.04em]">don't need</span> a data center.
          </h2>

          <div className="mt-9 grid gap-0 border border-black/35 lg:grid-cols-4">
            {workloadCards.map((item) => (
              <Link key={item.title} href="/login" className="border-b border-black/20 p-5 transition-colors hover:bg-black/[0.02] lg:border-b-0 lg:border-r lg:border-r-black/20 lg:last:border-r-0">
                <p className="eyebrow">{item.label}</p>
                <h3 className="mt-6 text-[24px] font-semibold tracking-[-0.04em]">{item.title}</h3>
                <p className="mt-3 text-[13px] text-black/42">{item.model}</p>
                <div className="mt-12 border-t border-dashed border-black/10 pt-5">
                  <div className="flex items-end gap-2">
                    <span className="text-[40px] font-semibold tracking-[-0.06em]">{item.price}</span>
                    <span className="pb-1 text-[12px] text-black/46">{item.unit}</span>
                  </div>
                  <p className="mt-2 text-[12px] text-black/42">market floor · spot</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#171611] text-[#f4f1ea]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 lg:grid-cols-[1.22fr_0.78fr] lg:items-end lg:py-16">
          <div>
            <p className="eyebrow text-white/38">$ 04 · In practice</p>
            <blockquote className="serif mt-6 max-w-[980px] text-[52px] leading-[0.96] tracking-[-0.06em] text-[#f3f0e8] sm:text-[68px] lg:text-[72px]">
              “We shipped a batch embedding pipeline for 400M documents in a weekend. Spent $1,200 instead of a quarter of AWS budget. My MacBook Air earned me $18 while I slept.”
            </blockquote>
            <p className="mono mt-8 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-white/55">
              <span className="dot live" />
              Priya Balakrishnan
              <span>· founding eng, Levain</span>
              <span>· job_81HEK</span>
              <span>· 412k matches</span>
              <span>· Mar 2026</span>
            </p>
          </div>

          <Link href="/login" className="justify-self-end border border-white/18 px-6 py-6 text-left lg:min-w-[275px]">
            <p className="eyebrow text-white/38">Total paid · all time</p>
            <div className="mt-4 border-b border-white/14 pb-5">
              <p className="text-[62px] font-semibold leading-none tracking-[-0.08em]">$2.4M</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5">
              <StatBlock label="Providers" value="3,921" />
              <StatBlock label="Countries" value="47" />
              <StatBlock label="Uptime" value="99.94%" />
              <StatBlock label="Ave match" value="2.1s" />
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}

function MetricStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="eyebrow text-white/34">{label}</p>
      <p className="mt-2 text-[38px] font-semibold leading-none tracking-[-0.08em]">{value}</p>
      <p className="mt-1 text-[12px] text-white/40">{sub}</p>
    </div>
  );
}

function HowCard({
  index,
  title,
  body,
  footer
}: {
  index: string;
  title: string;
  body: string;
  footer: React.ReactNode;
}) {
  return (
    <Link href="/login" className="border-b border-black/20 p-5 transition-colors hover:bg-black/[0.02] lg:border-b-0 lg:border-r lg:border-r-black/20 lg:last:border-r-0">
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">{index}</p>
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-black/26">
          {title === "Submit" ? "post /v1/jobs" : title === "Match" ? "scheduler.match()" : "payout.daily()"}
        </p>
      </div>
      <h3 className="mt-5 text-[42px] font-semibold tracking-[-0.06em]">{title}</h3>
      <p className="mt-4 min-h-[84px] text-[14px] leading-6 text-black/56">{body}</p>
      <div className="mt-6">{footer}</div>
    </Link>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow text-white/34">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-[-0.05em]">{value}</p>
    </div>
  );
}
