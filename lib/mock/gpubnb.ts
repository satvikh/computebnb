// Deterministic mock data used across every theme. Values are static so
// server-render and client-render match (no hydration jitter).

export type ProviderStatus = "online" | "busy" | "offline";
export type JobStatus = "queued" | "running" | "completed" | "failed";
export type JobKind =
  | "inference"
  | "embedding"
  | "transcription"
  | "finetune"
  | "render"
  | "batch";

export type Provider = {
  id: string;
  handle: string;
  nickname: string;
  status: ProviderStatus;
  location: string;
  flag: string;
  cpu: string;
  gpu: string;
  ramGB: number;
  hourlyRate: number; // USD/hour
  earnings30d: number; // USD
  lifetimeEarnings: number; // USD
  uptimeDays: number;
  reliability: number; // 0..1
  lastSeen: string;
  tags: string[];
  currentJob?: string;
  watts: number;
};

export type Job = {
  id: string;
  name: string;
  kind: JobKind;
  status: JobStatus;
  progress: number; // 0..100
  providerId?: string;
  owner: string;
  ownerAvatar: string;
  budgetUSD: number;
  payoutUSD: number;
  feeUSD: number;
  queuedAt: string;
  startedAt?: string;
  etaSec?: number;
  runtimeSec: number;
  modelLabel: string;
  logs: string[];
};

export type EarningsPoint = { label: string; usd: number };

export const PLATFORM_FEE = 0.2;
export const PROVIDER_CUT = 0.8;

export const providers: Provider[] = [
  {
    id: "prv_01",
    handle: "@mac-studio-07",
    nickname: "Moss",
    status: "online",
    location: "Brooklyn, NY",
    flag: "US",
    cpu: "M2 Ultra · 24c",
    gpu: "Apple 60-core",
    ramGB: 128,
    hourlyRate: 1.4,
    earnings30d: 412.18,
    lifetimeEarnings: 2841.4,
    uptimeDays: 42,
    reliability: 0.996,
    lastSeen: "now",
    tags: ["mps", "coreml", "stable"],
    currentJob: "job_7710",
    watts: 84
  },
  {
    id: "prv_02",
    handle: "@sierra-rig",
    nickname: "Sierra",
    status: "busy",
    location: "Denver, CO",
    flag: "US",
    cpu: "Ryzen 9 7950X",
    gpu: "RTX 4090 24GB",
    ramGB: 64,
    hourlyRate: 2.1,
    earnings30d: 1108.55,
    lifetimeEarnings: 9820.11,
    uptimeDays: 118,
    reliability: 0.989,
    lastSeen: "now",
    tags: ["cuda", "fp8", "fast"],
    currentJob: "job_7712",
    watts: 410
  },
  {
    id: "prv_03",
    handle: "@loft-thinkpad",
    nickname: "Loft",
    status: "online",
    location: "Berlin, DE",
    flag: "DE",
    cpu: "i7-1360P",
    gpu: "Iris Xe",
    ramGB: 32,
    hourlyRate: 0.35,
    earnings30d: 64.2,
    lifetimeEarnings: 211.4,
    uptimeDays: 9,
    reliability: 0.94,
    lastSeen: "12s ago",
    tags: ["cpu", "low-power", "fits-small"],
    watts: 22
  },
  {
    id: "prv_04",
    handle: "@garage-tower",
    nickname: "Cobalt",
    status: "online",
    location: "Austin, TX",
    flag: "US",
    cpu: "i9-14900K",
    gpu: "RTX 4080 Super",
    ramGB: 96,
    hourlyRate: 1.7,
    earnings30d: 815.98,
    lifetimeEarnings: 5402.3,
    uptimeDays: 73,
    reliability: 0.981,
    lastSeen: "now",
    tags: ["cuda", "large-vram", "stable"],
    currentJob: "job_7715",
    watts: 320
  },
  {
    id: "prv_05",
    handle: "@tokyo-mini",
    nickname: "Amber",
    status: "offline",
    location: "Tokyo, JP",
    flag: "JP",
    cpu: "M3 Max",
    gpu: "Apple 40-core",
    ramGB: 64,
    hourlyRate: 1.1,
    earnings30d: 298.61,
    lifetimeEarnings: 1721.0,
    uptimeDays: 54,
    reliability: 0.972,
    lastSeen: "42m ago",
    tags: ["mps", "coreml", "quiet"],
    watts: 0
  },
  {
    id: "prv_06",
    handle: "@attic-a100",
    nickname: "Veil",
    status: "busy",
    location: "Toronto, CA",
    flag: "CA",
    cpu: "Threadripper 7970X",
    gpu: "A100 40GB",
    ramGB: 256,
    hourlyRate: 3.4,
    earnings30d: 2110.2,
    lifetimeEarnings: 12003.7,
    uptimeDays: 201,
    reliability: 0.998,
    lastSeen: "now",
    tags: ["cuda", "hopper", "enterprise"],
    currentJob: "job_7719",
    watts: 540
  },
  {
    id: "prv_07",
    handle: "@surf-minipc",
    nickname: "Surf",
    status: "online",
    location: "Lisbon, PT",
    flag: "PT",
    cpu: "Ryzen 7 7840HS",
    gpu: "Radeon 780M",
    ramGB: 32,
    hourlyRate: 0.55,
    earnings30d: 142.33,
    lifetimeEarnings: 489.1,
    uptimeDays: 18,
    reliability: 0.952,
    lastSeen: "3s ago",
    tags: ["rocm", "compact"],
    watts: 48
  }
];

export const jobs: Job[] = [
  {
    id: "job_7719",
    name: "Weekly newsletter embeddings",
    kind: "embedding",
    status: "running",
    progress: 62,
    providerId: "prv_06",
    owner: "naomi.k",
    ownerAvatar: "N",
    budgetUSD: 12.0,
    payoutUSD: 9.6,
    feeUSD: 2.4,
    queuedAt: "09:41",
    startedAt: "09:43",
    etaSec: 214,
    runtimeSec: 312,
    modelLabel: "bge-small-en-v1.5",
    logs: [
      "chunk 412/800 encoded",
      "batch size auto-tuned to 64",
      "mean latency 38ms"
    ]
  },
  {
    id: "job_7715",
    name: "Support-ticket classifier sweep",
    kind: "inference",
    status: "running",
    progress: 41,
    providerId: "prv_04",
    owner: "deepa.r",
    ownerAvatar: "D",
    budgetUSD: 5.25,
    payoutUSD: 4.2,
    feeUSD: 1.05,
    queuedAt: "10:02",
    startedAt: "10:04",
    etaSec: 190,
    runtimeSec: 148,
    modelLabel: "llama-3.1-8b-q4",
    logs: ["warmed kv-cache", "tps 112", "stream healthy"]
  },
  {
    id: "job_7712",
    name: "Podcast transcript — ep. 42",
    kind: "transcription",
    status: "running",
    progress: 88,
    providerId: "prv_02",
    owner: "kushagra",
    ownerAvatar: "K",
    budgetUSD: 2.4,
    payoutUSD: 1.92,
    feeUSD: 0.48,
    queuedAt: "10:18",
    startedAt: "10:18",
    etaSec: 28,
    runtimeSec: 446,
    modelLabel: "whisper-large-v3",
    logs: [
      "segment 44 / 50",
      "speakers: 2 detected",
      "diarization merged"
    ]
  },
  {
    id: "job_7710",
    name: "Draft illustrations — pack A",
    kind: "render",
    status: "running",
    progress: 14,
    providerId: "prv_01",
    owner: "kushagra",
    ownerAvatar: "K",
    budgetUSD: 8.0,
    payoutUSD: 6.4,
    feeUSD: 1.6,
    queuedAt: "10:31",
    startedAt: "10:32",
    etaSec: 980,
    runtimeSec: 118,
    modelLabel: "sdxl-lightning",
    logs: ["img 1/12 rendered", "seed locked", "vram 18.4/24GB"]
  },
  {
    id: "job_7705",
    name: "Synthetic data batch — v7",
    kind: "batch",
    status: "queued",
    progress: 0,
    owner: "milan.p",
    ownerAvatar: "M",
    budgetUSD: 18.0,
    payoutUSD: 14.4,
    feeUSD: 3.6,
    queuedAt: "10:36",
    runtimeSec: 0,
    modelLabel: "gpt-oss-20b",
    logs: ["queued", "waiting for large-vram provider"]
  },
  {
    id: "job_7704",
    name: "Classroom essay grader",
    kind: "inference",
    status: "queued",
    progress: 0,
    owner: "prof.tan",
    ownerAvatar: "T",
    budgetUSD: 3.1,
    payoutUSD: 2.48,
    feeUSD: 0.62,
    queuedAt: "10:36",
    runtimeSec: 0,
    modelLabel: "mistral-7b",
    logs: ["queued", "awaiting provider assignment"]
  },
  {
    id: "job_7700",
    name: "Voice-memo diary embeddings",
    kind: "embedding",
    status: "completed",
    progress: 100,
    providerId: "prv_03",
    owner: "kushagra",
    ownerAvatar: "K",
    budgetUSD: 1.2,
    payoutUSD: 0.96,
    feeUSD: 0.24,
    queuedAt: "08:55",
    startedAt: "08:57",
    runtimeSec: 172,
    modelLabel: "nomic-embed-v1.5",
    logs: ["done", "vector count 1,240"]
  },
  {
    id: "job_7698",
    name: "Tiny LoRA — product tone",
    kind: "finetune",
    status: "completed",
    progress: 100,
    providerId: "prv_06",
    owner: "naomi.k",
    ownerAvatar: "N",
    budgetUSD: 41.5,
    payoutUSD: 33.2,
    feeUSD: 8.3,
    queuedAt: "06:10",
    startedAt: "06:12",
    runtimeSec: 6520,
    modelLabel: "llama-3-8b · rank 16",
    logs: ["loss 1.82 → 0.61", "checkpoint saved"]
  },
  {
    id: "job_7692",
    name: "Thumbnail upscaler — 8k",
    kind: "render",
    status: "failed",
    progress: 72,
    providerId: "prv_07",
    owner: "milan.p",
    ownerAvatar: "M",
    budgetUSD: 6.5,
    payoutUSD: 0,
    feeUSD: 0,
    queuedAt: "04:02",
    startedAt: "04:04",
    runtimeSec: 412,
    modelLabel: "real-esrgan",
    logs: ["cuda oom at step 72", "auto-retry scheduled"]
  }
];

export const earnings7d: EarningsPoint[] = [
  { label: "Mon", usd: 142.1 },
  { label: "Tue", usd: 188.6 },
  { label: "Wed", usd: 164.0 },
  { label: "Thu", usd: 231.4 },
  { label: "Fri", usd: 274.9 },
  { label: "Sat", usd: 198.2 },
  { label: "Sun", usd: 256.7 }
];

export const earnings24h: EarningsPoint[] = [
  { label: "00", usd: 4.1 },
  { label: "02", usd: 6.2 },
  { label: "04", usd: 3.4 },
  { label: "06", usd: 9.0 },
  { label: "08", usd: 14.8 },
  { label: "10", usd: 22.4 },
  { label: "12", usd: 19.6 },
  { label: "14", usd: 28.1 },
  { label: "16", usd: 31.5 },
  { label: "18", usd: 27.0 },
  { label: "20", usd: 18.2 },
  { label: "22", usd: 11.7 }
];

export const pricing = [
  {
    tier: "Sip",
    blurb: "Burst tasks, tiny models, zero commitment.",
    priceMin: 0.08,
    unit: "/minute",
    features: ["CPU / small-VRAM providers", "Under 30s median assign", "Pay-as-you-run"]
  },
  {
    tier: "Pour",
    blurb: "Medium batches for weekend projects.",
    priceMin: 0.9,
    unit: "/hour",
    features: ["Mid-tier RTX / M-series", "Priority queue", "Live progress feed"]
  },
  {
    tier: "Reserve",
    blurb: "Always-on machines for studios and agencies.",
    priceMin: 3.2,
    unit: "/hour",
    features: ["Dedicated A100 / H100 pool", "SLA 99.5%", "Invoiced billing"]
  }
];

export const payoutSummary = {
  pending: 38.12,
  nextPayout: "Friday 5pm ET",
  ytd: 4821.6,
  lifetime: 12740.4,
  feeRate: PLATFORM_FEE,
  providerCut: PROVIDER_CUT,
  method: "ACH · Chase ••4420"
};

export const killPanelStats = {
  onlineProviders: providers.filter((p) => p.status !== "offline").length,
  totalProviders: providers.length,
  activeJobs: jobs.filter((j) => j.status === "running").length,
  queuedJobs: jobs.filter((j) => j.status === "queued").length,
  completedToday: 37,
  totalGFLOPs: "412.9",
  networkPayoutPerMin: 2.84
};

export const activityStream = [
  { t: "10:36", msg: "job_7705 queued · waiting for 24GB VRAM", level: "info" },
  { t: "10:36", msg: "@attic-a100 accepted job_7719", level: "ok" },
  { t: "10:35", msg: "heartbeat · 6 providers online", level: "muted" },
  { t: "10:34", msg: "job_7692 FAILED · cuda oom · refund +$6.50", level: "warn" },
  { t: "10:32", msg: "@mac-studio-07 took job_7710 (sdxl-lightning)", level: "ok" },
  { t: "10:30", msg: "payout $33.20 → naomi.k · LoRA finetune", level: "pay" },
  { t: "10:28", msg: "@tokyo-mini went offline · geo: JP", level: "warn" },
  { t: "10:25", msg: "scheduler rebalanced queue (depth 2)", level: "muted" },
  { t: "10:22", msg: "@surf-minipc joined · 780M · ROCm", level: "ok" },
  { t: "10:18", msg: "job_7712 assigned to @sierra-rig", level: "ok" }
] as const;

export function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(n);
}

export function formatSec(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, "0")}m`;
}

export function statusTone(status: JobStatus | ProviderStatus): string {
  switch (status) {
    case "online":
    case "completed":
      return "emerald";
    case "busy":
    case "running":
      return "amber";
    case "offline":
    case "failed":
      return "rose";
    case "queued":
      return "sky";
    default:
      return "slate";
  }
}
