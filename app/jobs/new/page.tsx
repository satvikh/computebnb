import { MarketplaceShell } from "@/app/_components/marketplace-shell";

export default function NewJobPage() {
  return (
    <MarketplaceShell page="dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 0 }}>
        <section style={{ padding: "36px 28px", borderRight: "1px solid var(--rule-soft)" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>§ Submit demand</div>
          <h1 style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 72, letterSpacing: -2.8, lineHeight: 0.92, margin: 0 }}>
            Turn the machine
            <br />
            <span className="serif" style={{ fontSize: 72 }}>into the answer.</span>
          </h1>
          <p style={{ maxWidth: 620, margin: "20px 0 0", fontSize: 15, lineHeight: 1.8, color: "var(--ink-3)" }}>
            Queue a text-first workload, cap the budget, and let the marketplace route it onto the freshest eligible provider. This pass keeps inputs simple and results legible.
          </p>

          <form action="/api/jobs" method="post" style={{ marginTop: 30, border: "1px solid var(--rule)", background: "var(--paper-2)", padding: 22 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>TITLE</span>
                <input name="title" defaultValue="Summarize customer notes" required />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 14 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>JOB TYPE</span>
                  <select name="type" defaultValue="text_generation">
                    <option value="text_generation">Text generation</option>
                    <option value="image_caption">Image caption</option>
                    <option value="embedding">Embedding</option>
                    <option value="shell_demo">Shell demo</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>BUDGET</span>
                  <input name="budgetCents" type="number" min="100" defaultValue="500" required />
                </label>
              </div>

              <label style={{ display: "grid", gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>INPUT PAYLOAD</span>
                <textarea
                  name="input"
                  rows={10}
                  defaultValue="Turn this paragraph into three crisp bullets."
                  required
                />
              </label>

              <button
                type="submit"
                style={{
                  padding: "14px 18px",
                  border: "none",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  fontFamily: "var(--font-ui)",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: 2
                }}
              >
                Queue job →
              </button>
            </div>
          </form>
        </section>

        <aside style={{ padding: "36px 28px", background: "var(--ink)", color: "var(--paper)" }}>
          <div className="eyebrow" style={{ color: "rgba(244,241,234,0.5)", marginBottom: 10 }}>Current constraints</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: 36, fontWeight: 500, lineHeight: 1 }}>
            Text-only input.
            <br />
            Runtime-priced output.
          </div>
          <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
            {[
              ["Scheduling", "First queued job routes to the freshest eligible online provider."],
              ["Billing", "Final price is based on actual runtime and capped by your submitted budget."],
              ["Trust", "Each completion records a simple checksum, provider, runtime, and event trail."],
              ["Scope", "Artifacts stay inline as text for this hackathon pass."]
            ].map(([title, copy]) => (
              <div key={title} style={{ border: "1px solid rgba(244,241,234,0.12)", padding: 16 }}>
                <div className="mono" style={{ fontSize: 10, color: "rgba(244,241,234,0.5)", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(244,241,234,0.8)" }}>{copy}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </MarketplaceShell>
  );
}
