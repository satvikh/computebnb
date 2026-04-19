import Link from "next/link";
import { redirect } from "next/navigation";
import { listMarketplaceMachines } from "@/lib/mvp";
import { formatUsdFromCents } from "@/lib/payment-config";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const regionPool = ["us-west", "us-east", "us-central", "eu-west", "ap-northeast"] as const;
const cityPool = ["oakland", "sf", "austin", "nyc", "tokyo", "leipzig", "portland"] as const;
const badges = ["best value", "fastest", "verified", "low wait"] as const;

function estimateThroughput(machine: { ramGb: number }, index: number) {
  return Math.max(18, Math.round(machine.ramGb * 2.6 + (6 - index) * 4));
}

function estimateRating(index: number) {
  return (4.72 + ((index * 7) % 23) / 100).toFixed(2);
}

function estimateUptime(index: number) {
  return `${(71 + ((index * 9) % 28)).toFixed(1)}% uptime`;
}

function estimateStart(index: number) {
  return `start in ${(0.7 + index * 0.3).toFixed(1)}s`;
}

function sparklinePoints(index: number) {
  const base = [52, 58, 56, 62, 60, 68, 71, 78, 74, 86, 95];
  return base.map((point, offset) => `${offset * 12},${100 - Math.min(96, point + ((index * 3 + offset) % 9))}`).join(" ");
}

export default async function MachinesPage() {
  const user = await readSessionUser();
  if (!user || user.role !== "consumer") {
    redirect("/login");
  }

  const machines = await listMarketplaceMachines();
  const selected = machines[0] ?? null;

  return (
    <main className="gpu-root min-h-screen bg-[#f4f1ea] text-[#141410]">
      <header className="border-b border-black/25 bg-[#ece8dd]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 lg:px-5">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-[30px] font-semibold tracking-[-0.07em]">
              GPU<span className="serif text-[0.92em] font-normal">bnb</span><span className="ml-1 text-[#c8f13d]">•</span>
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              <Link href="/jobs" className="border border-black/10 px-4 py-2 text-[13px] text-black/62">
                Jobs
              </Link>
              <span className="border border-black bg-[#171611] px-4 py-2 text-[13px] font-medium text-[#f4f1ea]">
                Marketplace
              </span>
              <button type="button" className="px-4 py-2 text-[13px] text-black/48">Batches</button>
              <button type="button" className="px-4 py-2 text-[13px] text-black/48">Usage</button>
              <button type="button" className="px-4 py-2 text-[13px] text-black/48">Keys</button>
              <button type="button" className="px-4 py-2 text-[13px] text-black/48">Docs</button>
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <p className="mono hidden text-[11px] uppercase tracking-[0.15em] text-black/46 sm:flex sm:items-center sm:gap-2">
              <span className="dot live" />
              2,847 machines online
            </p>
            <p className="mono hidden text-[11px] uppercase tracking-[0.15em] text-black/46 lg:block">
              credits ${"84.20"}
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black bg-[#171611] text-[11px] font-semibold text-[#f4f1ea]">
              {(user.displayName ?? user.email ?? user.username ?? "AL").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-5">
        <div className="mb-5 flex flex-col gap-4 border-b border-black/12 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">$ Marketplace · {machines.length || "0"} machines · Apr 19 · 23:42 PT</p>
            <h1 className="mt-3 text-[48px] font-semibold leading-[0.95] tracking-[-0.07em] sm:text-[62px]">
              Pick a machine. <span className="serif text-[0.86em] tracking-[-0.04em]">Or let the scheduler pick for you.</span>
            </h1>
          </div>
          <button
            type="button"
            className="mono inline-flex h-[42px] items-center justify-between gap-5 border border-black/45 bg-[#f0ede4] px-4 text-[11px] uppercase tracking-[0.14em] text-black/55"
          >
            <span>Auto-match</span>
            <span className="flex items-center gap-2"><span className="dot live" />off · manual select</span>
            <span className="text-black">enable →</span>
          </button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[245px_minmax(0,1fr)_340px]">
          <aside className="space-y-5">
            <section className="border border-black/35 p-4">
              <p className="eyebrow">Job spec</p>
              <div className="mt-4 space-y-3">
                <div className="border border-black/15 bg-[#efebe1] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[18px] font-medium">batch-embed-prod</p>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.12em] text-black/34">job_01J2M…</p>
                    </div>
                  </div>
                  <div className="mono mt-4 space-y-2 text-[11px] uppercase tracking-[0.12em] text-black/58">
                    <div className="flex justify-between"><span>Model</span><span>llama-3.1-8b</span></div>
                    <div className="flex justify-between"><span>Input</span><span>prompts.jsonl</span></div>
                    <div className="flex justify-between"><span>Est tok</span><span>1.8M + 120k</span></div>
                    <div className="flex justify-between"><span>Budget</span><span>$0.40 ceiling</span></div>
                    <div className="flex justify-between"><span>Latency</span><span>flexible</span></div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <p className="eyebrow">Filters</p>
              <div className="mt-4 space-y-5 text-[12px] text-black/62">
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.16em] text-black/35">VRAM / unified memory</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["8G", "≥12G", "≥24G", "≥48G"].map((chip, index) => (
                      <button
                        key={chip}
                        type="button"
                        className={`border px-3 py-2 text-[12px] ${index === 1 ? "border-black bg-[#171611] text-[#f4f1ea]" : "border-black/18 bg-white/30"}`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.16em] text-black/35">Region</p>
                  <div className="mt-3 space-y-2">
                    {regionPool.map((region, index) => (
                      <label key={region} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked={index < 3} className="h-3.5 w-3.5 rounded-none border-black/30" />
                          <span>{region}</span>
                        </span>
                        <span className="mono text-[10px] uppercase tracking-[0.12em] text-black/32">{1241 - index * 186}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="mono text-[10px] uppercase tracking-[0.16em] text-black/35">Max / 1k tok</p>
                    <span className="mono text-[11px] uppercase tracking-[0.12em] text-black/44">$0.024</span>
                  </div>
                  <div className="mt-4 h-[3px] bg-black">
                    <div className="relative h-[3px] w-[74%] bg-[#c8f13d]">
                      <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 border border-black bg-[#c8f13d]" />
                    </div>
                  </div>
                  <div className="mono mt-3 flex justify-between text-[10px] uppercase tracking-[0.12em] text-black/30">
                    <span>$0.003</span>
                    <span>$0.050</span>
                  </div>
                </div>

                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.16em] text-black/35">Min rating</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["+ 4.5", "+ 4.8", "+ 4.9"].map((chip, index) => (
                      <button
                        key={chip}
                        type="button"
                        className={`border px-3 py-2 text-[12px] ${index === 1 ? "border-black bg-[#171611] text-[#f4f1ea]" : "border-black/18 bg-white/30"}`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.16em] text-black/35">Features</p>
                  <div className="mt-3 space-y-2">
                    {["Model pre-cached", "Dedicated (no preempt)", "Green energy", "Verified identity"].map((feature, index) => (
                      <label key={feature} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked={index !== 2} className="h-3.5 w-3.5 rounded-none border-black/30" />
                        <span>{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="button" className="w-full border border-black/18 bg-white/30 px-4 py-3 text-center text-[12px] text-black/46">
                  reset filters
                </button>
              </div>
            </section>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-3 border-b border-black/10 pb-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="mono text-[11px] uppercase tracking-[0.15em] text-black/42">
                {machines.length} machines match · {machines.filter((machine) => machine.status === "active").length} live right now
              </p>
              <div className="flex items-center gap-2">
                <span className="mono mr-2 text-[10px] uppercase tracking-[0.14em] text-black/35">Sort</span>
                {["best match", "cheapest", "fastest", "★ rating"].map((sort, index) => (
                  <button
                    key={sort}
                    type="button"
                    className={`border px-3 py-2 text-[12px] ${index === 0 ? "border-black bg-[#171611] text-[#f4f1ea]" : "border-black/14 bg-white/30 text-black/58"}`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {machines.map((machine, index) => {
                const region = regionPool[index % regionPool.length];
                const city = cityPool[index % cityPool.length];
                const pricePer1k = Math.max(0.007, machine.hourlyRateCents / 30000);
                const throughput = estimateThroughput(machine, index);
                const badge = badges[index % badges.length];
                const rating = estimateRating(index);
                const selectedRow = selected?.id === machine.id;

                return (
                  <article
                    key={machine.id}
                    className={`grid gap-5 border p-4 transition-colors md:grid-cols-[1.3fr_1.2fr_0.9fr_1fr_auto] ${
                      selectedRow ? "border-black bg-[#f0ede3] shadow-[inset_4px_0_0_#c8f13d]" : "border-black/14 bg-white/26 hover:bg-black/[0.02]"
                    }`}
                  >
                    <div className="grid grid-cols-[auto_1fr] gap-3">
                      <span className={`mt-2 h-2.5 w-2.5 rounded-full ${selectedRow ? "bg-[#c8f13d]" : index % 3 === 0 ? "bg-[#f07b2a]" : "bg-[#c8f13d]"}`} />
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-[17px] font-semibold leading-5 tracking-[-0.04em]">{machine.name}</h2>
                          <span className="bg-[#c8f13d] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-black">
                            {badge}
                          </span>
                        </div>
                        <p className="mono mt-2 text-[10px] uppercase tracking-[0.14em] text-black/36">{region} · {city}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[26px] font-semibold leading-none tracking-[-0.05em]">{machine.gpu}</p>
                      <p className="mt-1 text-[13px] text-black/48">{machine.ramGb} GB · {machine.cpu}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[34px] font-semibold leading-none tracking-[-0.07em]">{throughput}</p>
                        <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-black/34">tok/s</p>
                        <p className="mt-2 text-[12px] text-black/46">{estimateStart(index)}</p>
                      </div>
                      <div>
                        <p className="text-[28px] font-semibold leading-none tracking-[-0.06em]">★ {rating}</p>
                        <p className="mt-1 text-[12px] text-black/46">{estimateUptime(index)}</p>
                      </div>
                    </div>

                    <div>
                      <svg viewBox="0 0 130 44" className="h-12 w-full">
                        <polyline
                          fill="rgba(200,241,61,0.22)"
                          stroke="#8d8a7b"
                          strokeWidth="2"
                          points={`0,42 ${sparklinePoints(index)} 120,10 120,42`}
                        />
                        <polyline
                          fill="none"
                          stroke="#9aa438"
                          strokeWidth="2.2"
                          points={sparklinePoints(index)}
                        />
                      </svg>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.12em] text-black/34">throughput · 12h</p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right">
                        <p className="text-[38px] font-semibold leading-none tracking-[-0.07em]">
                          ${pricePer1k.toFixed(3)}
                        </p>
                        <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-black/34">/ 1k tok</p>
                        <p className="mt-2 text-[12px] text-black/54">{formatUsdFromCents(machine.hourlyRateCents)}/hour</p>
                      </div>
                      <Link
                        href={`/jobs/new?machineId=${machine.id}`}
                        className="mt-4 border border-black bg-[#171611] px-4 py-3 text-[12px] font-medium text-[#f4f1ea]"
                      >
                        Choose machine
                      </Link>
                    </div>
                  </article>
                );
              })}

              {!machines.length ? (
                <div className="border border-black/18 bg-white/30 p-8 text-[14px] text-black/48">
                  No active or busy machines are visible yet. Start a producer and set its machine status to active.
                </div>
              ) : null}
            </div>
          </section>

          <aside className="border border-black/85 bg-[#171611] p-5 text-[#f4f1ea]">
            <p className="eyebrow flex items-center gap-2 text-white/45">
              <span className="dot live animated" />
              Selected
            </p>

            {selected ? (
              <>
                <h2 className="mt-5 text-[42px] font-semibold leading-[0.94] tracking-[-0.07em]">{selected.name}</h2>
                <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-white/34">
                  {selected.gpu} · {selected.ramGb} GB · {regionPool[0]} · {cityPool[0]}
                </p>

                <div className="mt-7 grid grid-cols-3 gap-4 border-b border-white/10 pb-6">
                  <SideStat label="Price" value={`$${Math.max(0.007, selected.hourlyRateCents / 30000).toFixed(3)}`} sub="/ 1k tok" />
                  <SideStat label="Throughput" value={String(estimateThroughput(selected, 0))} sub="tok/s" />
                  <SideStat label="Rating" value={`★ ${estimateRating(0)}`} sub="2,944 jobs" />
                </div>

                <div className="mt-7 border-b border-white/10 pb-7">
                  <p className="eyebrow text-white/35">Cost estimate · 1.8M tok</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-[72px] font-semibold leading-none tracking-[-0.1em]">$25</span>
                    <span className="pb-2 text-[34px] font-semibold tracking-[-0.06em]">.20</span>
                    <span className="pb-3 pl-2 text-[12px] font-medium text-[#c8f13d]">+ $2.10</span>
                  </div>
                  <div className="mono mt-5 space-y-2 text-[11px] uppercase tracking-[0.14em] text-white/46">
                    <div className="flex justify-between"><span>compute · 1,800k × $0.014</span><span>$25.20</span></div>
                    <div className="flex justify-between"><span>platform fee · 0%</span><span>$0.00</span></div>
                    <div className="flex justify-between"><span>under $0.40 ceiling</span><span className="text-[#c8f13d]">✓ ok</span></div>
                  </div>
                  <div className="mt-5 h-[4px] bg-white/10">
                    <div className="h-[4px] w-[72%] bg-[#c8f13d]" />
                  </div>
                  <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-white/30">est. runtime · 5h 18m · complete by 04:58 PT</p>
                </div>

                <div className="mt-7 border-b border-white/10 pb-7">
                  <p className="eyebrow text-white/35">Match preview · dry run</p>
                  <div className="mono mt-4 space-y-2 text-[11px] uppercase tracking-[0.13em] text-white/58">
                    <div className="flex gap-3"><span className="text-white/30">22:14:12</span><span className="text-[#c8f13d]">●</span><span>handshake · tls1.3 · key pinned</span></div>
                    <div className="flex gap-3"><span className="text-white/30">22:14:13</span><span className="text-[#c8f13d]">●</span><span>routed to {selected.name}</span></div>
                    <div className="flex gap-3"><span className="text-white/30">22:14:13</span><span className="text-[#c8f13d]">●</span><span>daemon accepted · container signed</span></div>
                    <div className="flex gap-3"><span className="text-white/30">22:14:14</span><span className="text-[#c8f13d]">●</span><span>model cache hit · llama-3.1-8b</span></div>
                    <div className="flex gap-3"><span className="text-white/30">22:14:14</span><span className="text-[#c8f13d]">●</span><span>first token in 1.2s · ready</span></div>
                    <div className="flex gap-3"><span className="text-white/30">22:14:15</span><span className="text-white/28"> </span><span>streaming {estimateThroughput(selected, 0)} tok/s →</span></div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Link
                    href={`/jobs/new?machineId=${selected.id}`}
                    className="flex h-[74px] items-center justify-center border border-[#b9f031] bg-[#c8f13d] px-4 text-[18px] font-semibold text-[#171611]"
                  >
                    Launch on {selected.name} ⌘ ↵
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/jobs/new?machineId=${selected.id}`} className="flex h-[54px] items-center justify-center border border-white/16 text-[13px] text-white/84">
                      Save to fleet
                    </Link>
                    <Link href={`/jobs/new?machineId=${selected.id}`} className="flex h-[54px] items-center justify-center border border-white/16 text-[13px] text-white/84">
                      Copy as curl
                    </Link>
                  </div>
                  <p className="mono text-center text-[10px] uppercase tracking-[0.14em] text-white/28">
                    encrypted tunnel · sandboxed · refund on failure
                  </p>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-white/48">No machines are live right now.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function SideStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="eyebrow text-white/32">{label}</p>
      <p className="mt-2 text-[24px] font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-[11px] text-white/38">{sub}</p>
    </div>
  );
}
