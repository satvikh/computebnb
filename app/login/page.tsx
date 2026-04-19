"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fleet = [
  { name: "mbp-oakland-64", meta: "M2 Max · 32G · llama-3.1-8b · job_01JNK0", earnings: "$18.40", state: "earning", dot: "bg-[#f07b2a]" },
  { name: "rtx-sf-33", meta: "RTX 4070 · 12G · idle · listening", earnings: "$14.20", state: "earning", dot: "bg-[#c8f13d]" },
  { name: "m1-air-home-19", meta: "M1 Air · 8G · paused 3d ago", earnings: "$5.20", state: "idle", dot: "bg-white/45" }
];

const waiting = [
  { title: "Review payout", meta: "+ chase • 4281", value: "$37.80" },
  { title: "Approve new model", meta: "qwen2.5-7b • +$0.006/1k tok", value: "→" },
  { title: "Firmware update", meta: "daemon v0.8.4 → v0.9.1", value: "→" }
];

const networkCells = [
  "off","off","live","live","run","off","live","off","run","live","live","off","off","run","off","off","live","run","off","off","live","run","off","off",
  "off","off","live","run","live","off","off","live","off","off","run","live","off","live","run","off","off","live","off","off","run","live","live","off",
  "live","live","off","off","live","run","off","live","off","run","off","off","live","off","off","run","live","off","live","off","off","off","run","off",
  "run","off","off","live","off","off","run","off","live","off","live","run","off","off","live","off","run","off","off","live","off","off","live","off",
  "off","live","run","off","off","live","off","off","run","live","off","off","run","off","off","live","off","run","off","live","off","run","off","off",
  "live","off","off","run","live","off","live","off","off","off","run","live","off","off","live","off","live","off","off","run","live","off","live","off"
];

export default function LoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = identity.includes("@")
        ? { email: identity, displayName, role: "consumer" as const }
        : { username: identity, displayName, role: "consumer" as const };
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Sign-in failed");
      }

      router.push("/machines");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <main className="gpu-root min-h-screen bg-[#f4f1ea] text-[#141410]">
      <div className="grid min-h-screen lg:grid-cols-[1.52fr_1fr]">
        <section className="relative flex min-h-screen flex-col border-r border-black/20 bg-[#f4f1ea]">
          <div className="mx-auto flex w-full max-w-[920px] flex-1 flex-col px-6 pb-8 pt-5 lg:px-12 lg:pb-10 lg:pt-6">
            <header className="flex items-center justify-between">
              <Link href="/" className="text-[32px] font-semibold tracking-[-0.07em]">
                GPU<span className="serif text-[0.92em] font-normal">bnb</span><span className="ml-1 text-[#c8f13d]">•</span>
              </Link>
              <p className="text-[12px] text-black/48">
                New here?{" "}
                <Link href="/" className="border-b border-black/30 pb-[1px] text-black/72">
                  List your machine →
                </Link>
              </p>
            </header>

            <div className="flex flex-1 items-center py-8">
              <div className="w-full max-w-[610px]">
                <p className="eyebrow flex items-center gap-3">
                  <span className="dot live" />
                  Sign in · secure · ssh-key or email
                </p>

                <h1 className="mt-7 text-[62px] font-semibold leading-[0.92] tracking-[-0.08em] text-black sm:text-[78px]">
                  Welcome back.
                  <br />
                  <span className="serif text-[0.82em] tracking-[-0.04em]">Your machines</span>
                  <br />
                  <span className="text-black/62">missed you.</span>
                </h1>

                <p className="mt-7 max-w-[460px] text-[18px] leading-7 text-black/56">
                  You&apos;ve earned <span className="font-semibold text-black">$37.80</span> since your last sign-in. Two jobs are queued for review.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="eyebrow">Email</label>
                      <span className="mono text-[10px] uppercase tracking-[0.14em] text-black/32">remembered</span>
                    </div>
                    <input
                      className="h-[58px] w-full rounded-none border border-black/28 bg-transparent px-4 text-[16px] text-black placeholder:text-black/28 focus-visible:ring-0"
                      value={identity}
                      onChange={(event) => setIdentity(event.target.value)}
                      placeholder="priya@levain.ai"
                      required
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="eyebrow">Display name</label>
                      <span className="text-[11px] text-black/36">Optional</span>
                    </div>
                    <input
                      className="h-[58px] w-full rounded-none border border-black/28 bg-transparent px-4 text-[16px] text-black placeholder:text-black/28 focus-visible:ring-0"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="GPUbnb consumer"
                    />
                  </div>

                  <div className="flex items-center justify-between border border-black/18 bg-[#efebe1] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="dot live animated" />
                      <div>
                        <p className="text-[12px] text-black/72">Push approval sent to iPhone 15 · Oakland</p>
                      </div>
                    </div>
                    <span className="mono text-[10px] uppercase tracking-[0.16em] text-black/36">waiting · 00:14</span>
                  </div>

                  {error ? (
                    <div className="border border-[#c4352b]/40 bg-[#c4352b]/8 px-4 py-3 text-[13px] text-[#8f251d]">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-[60px] w-full items-center justify-center border border-black bg-[#171611] px-5 text-[15px] font-medium text-[#f4f1ea] transition hover:bg-black disabled:opacity-70"
                  >
                    {loading ? "Signing in to GPUbnb…" : "Sign in to GPUbnb →"}
                  </button>
                </form>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-black/42">
                  <p>session · encrypted · soc 2 type II · device trust on</p>
                </div>

                <div className="mt-7 flex items-center justify-between border border-black/14 bg-white/22 px-4 py-4">
                  <span className="mono text-[11px] uppercase tracking-[0.16em] text-black/56">cli&nbsp;&nbsp; gpubnb auth login --device</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText("gpubnb auth login --device")}
                    className="mono text-[10px] uppercase tracking-[0.16em] text-black/38"
                  >
                    copy
                  </button>
                </div>
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-5 text-[11px] text-black/38">
              <div className="flex items-center gap-3">
                <span>© 2026 GPUbnb Labs</span>
                <Link href="/" className="border-b border-black/15">terms</Link>
                <Link href="/" className="border-b border-black/15">privacy</Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="dot live" />
                <span>all systems nominal · status.gpubnb.sh</span>
              </div>
            </footer>
          </div>
        </section>

        <aside className="flex min-h-screen flex-col bg-[#171611] px-6 py-6 text-[#f4f1ea] lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-[480px] flex-col">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-white/34">While you were away · 3 days 4 hours</p>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-[92px] font-semibold leading-none tracking-[-0.1em]">$37</span>
              <span className="pb-3 text-[36px] font-semibold tracking-[-0.08em]">.80</span>
              <span className="pb-4 text-[12px] font-medium text-[#c8f13d]">+$4.12 today</span>
            </div>
            <p className="mono mt-2 text-[11px] uppercase tracking-[0.14em] text-white/42">
              earned across 3 machines · 142 jobs completed · 0 failed
            </p>

            <div className="mt-8 border-b border-white/12 pb-8">
              <div className="flex items-end gap-[3px]">
                {[10,12,14,16,15,18,19,18,20,22,24,25,24,26,28,30,29,31,34,38,42,45,43,41,44,46].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className={`block w-3 ${index > 19 ? "bg-[#c8f13d]" : "bg-white/18"}`}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
              <div className="mono mt-3 flex justify-between text-[10px] uppercase tracking-[0.16em] text-white/28">
                <span>last sign-in · Apr 16 · 19:02</span>
                <span>now · Apr 19 · 23:18</span>
              </div>
            </div>

            <div className="mt-8 border-b border-white/12 pb-7">
              <p className="eyebrow text-white/38">Your fleet · 3 machines</p>
              <div className="mt-5 space-y-4">
                {fleet.map((item) => (
                  <div key={item.name} className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.dot}`} />
                    <div>
                      <p className="text-[14px] font-medium text-white/94">{item.name}</p>
                      <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-white/34">{item.meta}</p>
                    </div>
                    <div className="text-right">
                      <p className="mono text-[10px] uppercase tracking-[0.14em] text-white/28">3d earnings</p>
                      <p className="mt-1 text-[14px] font-medium">{item.earnings}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex-1">
              <p className="eyebrow text-white/38">Waiting for you</p>
              <div className="mt-5 space-y-5">
                {waiting.map((item, index) => (
                  <div key={item.title} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-medium">{item.title}</p>
                      <p className="mt-1 text-[11px] text-white/38">{item.meta}</p>
                    </div>
                    <p className={`text-[14px] font-medium ${index === 0 ? "text-[#c8f13d]" : "text-white/52"}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 border-t border-white/12 pt-5">
              <div className="mono flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/36">
                <span>network · us-west · live</span>
                <span>2,847 online · 412 running · avg match 2.1s</span>
              </div>
              <div className="mgrid inv mt-4">
                {networkCells.map((state, index) => (
                  <span key={`${state}-${index}`} className={`cell ${state === "live" ? "on" : state}`} />
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
