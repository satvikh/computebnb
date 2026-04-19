"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatUsdFromCents } from "@/lib/payment-config";

type SessionUser = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  role: "consumer" | "producer";
};

type Machine = {
  id: string;
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  status: "active" | "inactive" | "busy";
  hourlyRateCents: number;
};

function NewJobPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMachineId = searchParams.get("machineId");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineId, setMachineId] = useState(defaultMachineId ?? "");
  const [filename, setFilename] = useState("script.py");
  const [timeoutSeconds, setTimeoutSeconds] = useState("60");
  const [code, setCode] = useState("print('hello from GPUbnb')");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [meResponse, machinesResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/machines", { cache: "no-store" }),
        ]);

        const meData = await meResponse.json();
        const machinesData = await machinesResponse.json();
        if (!meData.user || meData.user.role !== "consumer") {
          router.push("/login");
          return;
        }

        setUser(meData.user);
        setMachines(machinesData.machines ?? []);
        if (!defaultMachineId && machinesData.machines?.[0]?.id) {
          setMachineId(machinesData.machines[0].id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [defaultMachineId, router]);

  const selectedMachine = useMemo(
    () => machines.find((machine) => machine.id === machineId) ?? null,
    [machineId, machines]
  );

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".py")) {
      setError("Only one .py file is supported.");
      return;
    }
    setFilename(file.name);
    setCode(await file.text());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError("Consumer session missing.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consumerUserId: user.id,
          machineId,
          code,
          filename,
          timeoutSeconds: Number(timeoutSeconds),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit job");
      }
      router.push(`/jobs/${data.job.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit job");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="gpu-root min-h-screen bg-[#f4f1ea] p-8 text-[#141410]">Loading…</main>;
  }

  return (
    <main className="gpu-root min-h-screen bg-[#f4f1ea] text-[#141410]">
      <div className="mx-auto max-w-[1520px] px-4 py-5 lg:px-5">
        <div className="mb-5 flex flex-col gap-4 border-b border-black/12 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">$ submit job · single python file · manual machine select</p>
            <h1 className="mt-3 text-[48px] font-semibold leading-[0.95] tracking-[-0.07em] sm:text-[62px]">
              Submit a script. <span className="serif text-[0.86em] tracking-[-0.04em]">Keep it simple, send it clean.</span>
            </h1>
            <p className="mt-4 max-w-[720px] text-[18px] leading-7 text-black/56">
              Signed in as {user?.displayName ?? user?.email ?? user?.username}. Choose one machine, upload one <span className="mono text-[0.9em]">.py</span> file or paste code, then the selected producer runs it in Docker.
            </p>
          </div>
          <Link href="/machines" className="mono inline-flex h-[42px] items-center border border-black/35 bg-white/30 px-4 text-[11px] uppercase tracking-[0.14em] text-black/66">
            ← back to marketplace
          </Link>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={handleSubmit} className="border border-black/30 bg-[#f6f2e8] p-5 shadow-[inset_0_0_0_1px_rgba(20,20,16,0.04)]">
            <div className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-[1.2fr_1.4fr]">
                <label className="border border-black/18 bg-white/18 text-sm text-black/68">
                  <span className="eyebrow block border-b border-black/12 px-4 py-3">Machine</span>
                  <select
                    className="h-[58px] w-full rounded-none border-0 bg-transparent px-4 text-[14px] text-black"
                    value={machineId}
                    onChange={(event) => setMachineId(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select machine
                    </option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name} | {machine.gpu} | {machine.ramGb} GB | {formatUsdFromCents(machine.hourlyRateCents)}/hr | {machine.status}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-0 border border-black/18 bg-white/18 md:grid-cols-[1fr_0.7fr]">
                  <label className="text-sm text-black/68">
                    <span className="eyebrow block border-b border-black/12 px-4 py-3">Filename</span>
                    <input
                      className="h-[58px] w-full rounded-none border-0 bg-transparent px-4 text-[14px] text-black placeholder:text-black/28"
                      value={filename}
                      onChange={(event) => setFilename(event.target.value)}
                    />
                  </label>

                  <label className="border-l border-black/12 text-sm text-black/68">
                    <span className="eyebrow block border-b border-black/12 px-4 py-3">Timeout</span>
                    <input
                      type="number"
                      min={1}
                      className="h-[58px] w-full rounded-none border-0 bg-transparent px-4 text-[14px] text-black"
                      value={timeoutSeconds}
                      onChange={(event) => setTimeoutSeconds(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <label className="text-sm text-black/68">
                  <span className="eyebrow block border border-b-0 border-black/18 bg-white/18 px-4 py-3">Python code</span>
                  <textarea
                    className="min-h-[470px] w-full rounded-none border border-black/18 bg-white/10 px-4 py-4 font-mono text-[14px] text-black"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    spellCheck={false}
                  />
                </label>

                <div className="space-y-5">
                  <section className="border border-black/20 bg-white/24 p-4">
                    <p className="eyebrow">Upload</p>
                    <input
                      type="file"
                      accept=".py"
                      className="mt-4 block w-full text-sm text-black/62 file:mr-3 file:border file:border-black/25 file:bg-[#171611] file:px-3 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.14em] file:text-[#f4f1ea]"
                      onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
                    />
                    <p className="mt-4 text-[13px] leading-6 text-black/52">
                      One file only. The backend stores the Python source directly with the job for this MVP.
                    </p>
                  </section>

                  <section className="border border-black/20 bg-white/24 p-4">
                    <p className="eyebrow">Execution notes</p>
                    <div className="mt-4 space-y-3 text-[13px] leading-6 text-black/56">
                      <p>Runs in a basic Python Docker image.</p>
                      <p>One job at a time per machine.</p>
                      <p>Output returns as stdout, stderr, and exit code.</p>
                      <p>No dependencies or package installs in this flow.</p>
                    </div>
                  </section>

                  <section className="border border-black/20 bg-[#171611] p-4 text-[#f4f1ea]">
                    <p className="eyebrow text-white/38">Dispatch</p>
                    <div className="mono mt-4 space-y-2 text-[11px] uppercase tracking-[0.13em] text-white/54">
                      <div className="flex justify-between"><span>selected machine</span><span>{selectedMachine?.name ?? "pending"}</span></div>
                      <div className="flex justify-between"><span>pricing</span><span>{selectedMachine ? `${formatUsdFromCents(selectedMachine.hourlyRateCents)}/hour` : "pending"}</span></div>
                      <div className="flex justify-between"><span>timeout</span><span>{timeoutSeconds}s</span></div>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-5 flex h-[58px] w-full items-center justify-center border border-[#b9f031] bg-[#c8f13d] px-4 text-[15px] font-semibold text-[#171611] disabled:opacity-70"
                    >
                      {submitting ? "Submitting…" : "Create job →"}
                    </button>
                  </section>
                </div>
              </div>

              {error ? (
                <div className="border border-[#c4352b]/40 bg-[#c4352b]/8 px-4 py-3 text-[13px] text-[#8f251d]">
                  {error}
                </div>
              ) : null}
            </div>
          </form>

          <aside className="border border-black/85 bg-[#171611] p-5 text-[#f4f1ea]">
            <p className="eyebrow flex items-center gap-2 text-white/45">
              <span className="dot live animated" />
              Selected machine
            </p>
            {selectedMachine ? (
              <>
                <h2 className="mt-5 text-[40px] font-semibold leading-[0.96] tracking-[-0.07em]">{selectedMachine.name}</h2>
                <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-white/34">
                  {selectedMachine.gpu} · {selectedMachine.ramGb} GB · docker-backed python
                </p>

                <div className="mt-7 grid grid-cols-2 gap-4 border-b border-white/10 pb-6">
                  <DetailStat label="Price" value={formatUsdFromCents(selectedMachine.hourlyRateCents)} sub="/ hour" />
                  <DetailStat label="Status" value={selectedMachine.status} sub="marketplace live" />
                  <DetailStat label="CPU" value={selectedMachine.cpu} sub="host class" />
                  <DetailStat label="GPU" value={selectedMachine.gpu} sub="reported spec" />
                </div>

                <div className="mt-7 border-b border-white/10 pb-6">
                  <p className="eyebrow text-white/35">What happens next</p>
                  <div className="mono mt-4 space-y-2 text-[11px] uppercase tracking-[0.13em] text-white/56">
                    <div className="flex gap-3"><span className="text-white/30">01</span><span>job stored in backend</span></div>
                    <div className="flex gap-3"><span className="text-white/30">02</span><span>producer polls every few seconds</span></div>
                    <div className="flex gap-3"><span className="text-white/30">03</span><span>docker runs python script</span></div>
                    <div className="flex gap-3"><span className="text-white/30">04</span><span>stdout + stderr written back</span></div>
                  </div>
                </div>

                <div className="mt-7">
                  <p className="eyebrow text-white/35">Preview</p>
                  <pre className="mono mt-4 whitespace-pre-wrap text-[11px] leading-6 text-white/62">{`POST /api/jobs
machineId=${selectedMachine.id}
filename=${filename}
timeoutSeconds=${timeoutSeconds}
budget=${formatUsdFromCents(500)} ceiling`}</pre>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-white/48">Choose a machine to submit the job.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function DetailStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="eyebrow text-white/32">{label}</p>
      <p className="mt-2 text-[22px] font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-[11px] text-white/38">{sub}</p>
    </div>
  );
}

export default function NewJobPage() {
  return (
    <Suspense fallback={<main className="gpu-root min-h-screen bg-[#f4f1ea] p-8 text-[#141410]">Loading…</main>}>
      <NewJobPageContent />
    </Suspense>
  );
}
