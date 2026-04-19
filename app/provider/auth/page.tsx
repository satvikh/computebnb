"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProviderAuthPage() {
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
        ? { email: identity, displayName, role: "producer" as const }
        : { username: identity, displayName, role: "producer" as const };
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to sign in");
      }

      router.push("/provider/setup");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to sign in");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">GPUbnb producer</p>
        <h1 className="mt-4 text-4xl font-semibold">Sign in and register your machine.</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
            placeholder="producer@example.com"
            required
          />
          <input
            className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-white"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Producer display name"
          />
          {error ? <div className="text-sm text-rose-300">{error}</div> : null}
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-md bg-lime-300 font-medium text-zinc-950 disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Continue to machine setup"}
          </button>
        </form>
      </div>
    </main>
  );
}
