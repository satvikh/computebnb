export type SampleJob = {
  id: string;
  title: string;
  description: string;
  type: "shell_demo" | "text_generation" | "embedding";
  input: string;
  budgetCents: number;
  requiredCapabilities: string[];
  runnerPayload: {
    type: "python_script" | "inference" | "benchmark_demo";
    script?: string;
    input?: Record<string, unknown>;
    limits: {
      timeoutMs: number;
      cpus: number;
      memoryMb: number;
      pidsLimit: number;
    };
  };
};

export const sampleJobs: SampleJob[] = [
  {
    id: "csv_profile",
    title: "Profile a CSV export",
    description: "Requester sends a tiny Python script that summarizes rows, columns, missing values, and numeric ranges.",
    type: "shell_demo",
    input: "Run the CSV profiling script and return the stdout summary.",
    budgetCents: 650,
    requiredCapabilities: ["cpu", "docker"],
    runnerPayload: {
      type: "python_script",
      script: `import csv
from io import StringIO

raw = """name,region,revenue,users
acme,west,18200,410
bravo,east,9400,205
cedar,west,15100,338
delta,south,12150,284
"""

rows = list(csv.DictReader(StringIO(raw)))
revenues = [int(row["revenue"]) for row in rows]
users = [int(row["users"]) for row in rows]
print(f"rows={len(rows)} columns={len(rows[0])}")
print(f"revenue_total={sum(revenues)} revenue_max={max(revenues)}")
print(f"users_total={sum(users)} avg_users={round(sum(users) / len(users), 2)}")
print("regions=" + ",".join(sorted({row["region"] for row in rows})))`,
      limits: {
        timeoutMs: 15000,
        cpus: 1,
        memoryMb: 256,
        pidsLimit: 64
      }
    }
  },
  {
    id: "sentiment_batch",
    title: "Score support-ticket sentiment",
    description: "Runs an approved text scoring script over a few requester notes and returns positive/neutral/negative counts.",
    type: "shell_demo",
    input: "Classify this small support-ticket batch and return sentiment counts.",
    budgetCents: 700,
    requiredCapabilities: ["cpu", "docker"],
    runnerPayload: {
      type: "python_script",
      script: `tickets = [
  "The install was smooth and the app feels fast.",
  "The worker crashed twice while Docker was starting.",
  "I found the payout screen but I am unsure what pending means.",
  "Great onboarding flow. The dashboard is clear."
]

positive_words = {"smooth", "fast", "great", "clear"}
negative_words = {"crashed", "unsure", "twice"}
counts = {"positive": 0, "neutral": 0, "negative": 0}

for ticket in tickets:
    words = set(ticket.lower().replace(".", "").split())
    score = len(words & positive_words) - len(words & negative_words)
    label = "positive" if score > 0 else "negative" if score < 0 else "neutral"
    counts[label] += 1
    print(f"{label}: {ticket}")

print("summary=" + ", ".join(f"{key}:{value}" for key, value in counts.items()))`,
      limits: {
        timeoutMs: 15000,
        cpus: 1,
        memoryMb: 256,
        pidsLimit: 64
      }
    }
  },
  {
    id: "numeric_benchmark",
    title: "Run a CPU benchmark demo",
    description: "Uses the worker-runner benchmark payload to prove the provider can execute an approved container job.",
    type: "shell_demo",
    input: "Run the approved benchmark demo with 150000 iterations.",
    budgetCents: 500,
    requiredCapabilities: ["cpu", "docker"],
    runnerPayload: {
      type: "benchmark_demo",
      input: {
        iterations: 150000
      },
      limits: {
        timeoutMs: 15000,
        cpus: 1,
        memoryMb: 256,
        pidsLimit: 64
      }
    }
  }
];

export function sampleJobPayload(job: SampleJob) {
  return JSON.stringify(job.runnerPayload, null, 2);
}
