// Run in mongosh after selecting the GPUbnb database:
// use gpubnb
// load("mongodb/seed.js")

const now = new Date();

const machineResult = db.machines.insertOne({
  name: "Sample Python Laptop",
  status: "online",
  capabilities: ["python", "cpu"],
  hourlyRateCents: 300,
  totalEarnedCents: 0,
  completedJobs: 0,
  failedJobs: 0,
  successRate: 100,
  trustScore: 100,
  lastHeartbeatAt: now,
  createdAt: now,
  updatedAt: now
});

const jobResult = db.jobs.insertOne({
  title: "Run sample Python summary",
  type: "python",
  status: "queued",
  machineId: machineResult.insertedId,
  source: "print('GPUbnb sample job')",
  stdout: "",
  stderr: "",
  budgetCents: 700,
  createdAt: now,
  updatedAt: now
});

db.jobevents.insertOne({
  jobId: jobResult.insertedId,
  machineId: machineResult.insertedId,
  type: "queued",
  message: "Seed job queued for Sample Python Laptop",
  createdAt: now,
  updatedAt: now
});
