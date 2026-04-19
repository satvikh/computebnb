"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/app/_components/chrome";

type MachineOption = {
  id: string;
  name: string;
  status: string;
  capabilities: string[];
  hourlyRateCents: number;
  successRate: number;
  lastHeartbeatAt: string | null;
};

type NewJobFormProps = {
  machines: MachineOption[];
  defaultMachineId: string | null;
};

function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function statusToPill(status: string) {
  if (status === "online") return "live";
  if (status === "busy") return "running";
  return "idle";
}

function heartbeatLabel(heartbeat: string | null) {
  if (!heartbeat) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(heartbeat).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function NewJobForm({ machines, defaultMachineId }: NewJobFormProps) {
  const router = useRouter();
  const [selectedMachineId, setSelectedMachineId] = React.useState(defaultMachineId ?? machines[0]?.id ?? "");
  const [title, setTitle] = React.useState("Run Python script");
  const [budgetCents, setBudgetCents] = React.useState("500");
  const [pythonCode, setPythonCode] = React.useState("# Write Python here\nprint('Hello from GPUbnb')");
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!machines.length) return;
    const hasSelectedMachine = machines.some((machine) => machine.id === selectedMachineId);
    if (hasSelectedMachine) return;
    setSelectedMachineId(defaultMachineId ?? machines[0].id);
  }, [defaultMachineId, machines, selectedMachineId]);

  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) ?? null;

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".py")) {
      setErrorMessage("Only .py files are supported for this MVP flow.");
      event.currentTarget.value = "";
      return;
    }

    const contents = await file.text();
    setUploadedFileName(file.name);
    setPythonCode(contents);
    if (!title.trim() || title === "Run Python script") {
      setTitle(`Run ${file.name}`);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!selectedMachine) {
      setErrorMessage("Choose a machine before submitting.");
      return;
    }

    if (!pythonCode.trim()) {
      setErrorMessage("Python code cannot be empty.");
      return;
    }

    const parsedBudget = Number.parseInt(budgetCents, 10);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setErrorMessage("Budget must be a positive number in cents.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || `Run python on ${selectedMachine.name}`,
          type: "python",
          machineId: selectedMachine.id,
          source: uploadedFileName ? `# file: ${uploadedFileName}\n${pythonCode}` : pythonCode,
          budgetCents: parsedBudget,
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to create job");
      }

      const data = (await response.json()) as { job?: { id?: string } };
      const createdJobId = data.job?.id;
      if (!createdJobId) {
        throw new Error("Job created but response did not include an id.");
      }

      router.push(`/jobs/${createdJobId}/results`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create job.");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 0 }}>
      <section style={{ padding: "36px 28px", borderRight: "1px solid var(--rule-soft)" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>§ Step 02 · Submit Python</div>
        <h1 style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 66, letterSpacing: -2.5, lineHeight: 0.92, margin: 0 }}>
          Select machine.
          <br />
          <span className="serif" style={{ fontSize: 66 }}>Run code.</span>
        </h1>
        <p style={{ maxWidth: 620, margin: "20px 0 0", fontSize: 15, lineHeight: 1.8, color: "var(--ink-3)" }}>
          Submit raw Python from the editor or upload a <span className="mono">.py</span> file. The selected machine is the exact execution target for this job.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 30, border: "1px solid var(--rule)", background: "var(--paper-2)", padding: 22 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>MACHINE</span>
              <select
                value={selectedMachineId}
                onChange={(event) => setSelectedMachineId(event.target.value)}
                required
              >
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} · {machine.status} · {centsToDollars(machine.hourlyRateCents)}/hr
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 14 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>JOB TITLE</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>BUDGET (CENTS)</span>
                <input
                  value={budgetCents}
                  onChange={(event) => setBudgetCents(event.target.value)}
                  type="number"
                  min={100}
                  required
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>UPLOAD .PY (OPTIONAL)</span>
              <input type="file" accept=".py,text/x-python" onChange={handleUploadChange} />
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>
                {uploadedFileName ? `Loaded ${uploadedFileName}` : "No file loaded. Editor content will be submitted."}
              </span>
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>PYTHON CODE</span>
              <textarea
                value={pythonCode}
                onChange={(event) => setPythonCode(event.target.value)}
                rows={12}
                required
                spellCheck={false}
                className="mono"
              />
            </label>

            {errorMessage && (
              <div style={{ border: "1px solid rgba(196,53,43,0.35)", background: "rgba(196,53,43,0.08)", color: "var(--error)", padding: "10px 12px", fontSize: 13 }}>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "14px 18px",
                border: "none",
                background: "var(--ink)",
                color: "var(--paper)",
                fontFamily: "var(--font-ui)",
                fontSize: 15,
                fontWeight: 500,
                cursor: submitting ? "default" : "pointer",
                borderRadius: 2,
                opacity: submitting ? 0.8 : 1
              }}
            >
              {submitting ? "Creating job..." : "Create job →"}
            </button>
          </div>
        </form>
      </section>

      <aside style={{ padding: "36px 28px", background: "var(--ink)", color: "var(--paper)" }}>
        <div className="eyebrow" style={{ color: "rgba(244,241,234,0.5)", marginBottom: 10 }}>Selected machine</div>
        {selectedMachine ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 38, fontWeight: 500, lineHeight: 1 }}>{selectedMachine.name}</div>
              <StatusPill state={statusToPill(selectedMachine.status)}>{selectedMachine.status}</StatusPill>
            </div>
            <div className="mono" style={{ marginTop: 10, fontSize: 11, color: "rgba(244,241,234,0.65)" }}>
              heartbeat {heartbeatLabel(selectedMachine.lastHeartbeatAt)}
            </div>
            <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
              <Panel label="Rate" value={`${centsToDollars(selectedMachine.hourlyRateCents)}/hr`} />
              <Panel label="Reliability" value={`${selectedMachine.successRate}% success`} />
              <Panel label="Capabilities" value={selectedMachine.capabilities.join(" · ")} />
              <Panel label="Execution contract" value="source -> stdout/stderr/exitCode in result view" />
            </div>
          </>
        ) : (
          <div style={{ border: "1px solid rgba(244,241,234,0.12)", padding: 16 }}>
            No machine selected.
          </div>
        )}
      </aside>
    </div>
  );
}

function Panel({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(244,241,234,0.12)", padding: 16 }}>
      <div className="mono" style={{ fontSize: 10, color: "rgba(244,241,234,0.5)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(244,241,234,0.84)" }}>{value}</div>
    </div>
  );
}
