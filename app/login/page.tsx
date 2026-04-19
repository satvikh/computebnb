"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">GPUbnb consumer</p>
        <h1 className="mt-4 text-4xl font-semibold">Sign in and run Python on a remote machine.</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          This MVP uses a minimal mock session. Enter an email or username, then pick a machine and submit one Python file.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Email or username</label>
            <input
              className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              placeholder="consumer@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Display name</label>
            <input
              className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="GPUbnb Consumer"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-md bg-lime-300 font-medium text-zinc-950 disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Continue to marketplace"}
          </button>
        </form>
      </div>
    </main>
  );
}
