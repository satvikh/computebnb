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
    return <main className="min-h-screen bg-zinc-950 p-8 text-white">Loading…</main>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Submit job</p>
            <h1 className="mt-3 text-4xl font-semibold">Paste Python and run it on a selected machine</h1>
          </div>
          <Link href="/machines" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
            Back to machines
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="grid gap-4">
              <label className="text-sm text-zinc-300">
                <span className="mb-2 block">Machine</span>
                <select
                  className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  <span className="mb-2 block">Filename</span>
                  <input
                    className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
                    value={filename}
                    onChange={(event) => setFilename(event.target.value)}
                  />
                </label>
                <label className="text-sm text-zinc-300">
                  <span className="mb-2 block">Timeout seconds</span>
                  <input
                    type="number"
                    min={1}
                    className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
                    value={timeoutSeconds}
                    onChange={(event) => setTimeoutSeconds(event.target.value)}
                  />
                </label>
              </div>

              <label className="text-sm text-zinc-300">
                <span className="mb-2 block">Upload .py</span>
                <input
                  type="file"
                  accept=".py"
                  className="block w-full text-sm text-zinc-300"
                  onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
                />
              </label>

              <label className="text-sm text-zinc-300">
                <span className="mb-2 block">Python code</span>
                <textarea
                  className="min-h-[320px] w-full rounded-md border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  spellCheck={false}
                />
              </label>

              {error ? (
                <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="h-12 rounded-md bg-lime-300 font-medium text-zinc-950 disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Create job"}
              </button>
            </div>
          </form>

          <aside className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Selected machine</p>
            {selectedMachine ? (
              <>
                <h2 className="mt-4 text-2xl font-semibold">{selectedMachine.name}</h2>
                <div className="mt-4 space-y-2 text-sm text-zinc-300">
                  <p>CPU: {selectedMachine.cpu}</p>
                  <p>GPU: {selectedMachine.gpu}</p>
                  <p>RAM: {selectedMachine.ramGb} GB</p>
                  <p>Price: {formatUsdFromCents(selectedMachine.hourlyRateCents)}/hour</p>
                  <p>Status: {selectedMachine.status}</p>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">Choose a machine to submit the job.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function NewJobPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-950 p-8 text-white">Loading…</main>}>
      <NewJobPageContent />
    </Suspense>
  );
}
