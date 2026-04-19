# MongoDB Atlas Collections

GPUbnb's simplified MVP backend persists four core collections:

- `machines`: inventory plus mocked worker auth metadata
- `jobs`: machine-pinned Python jobs and their execution outputs
- `jobevents`: append-only lifecycle trail
- `ledgerentries`: captured job charge, machine payout, and platform fee rows

The legacy `/api/providers/*` routes still exist as a compatibility layer for mocked auth, but they now read and write the `machines` collection.

## `machines`

```ts
{
  _id: ObjectId,
  name: string,
  status: "online" | "offline" | "busy",
  capabilities: string[],
  hourlyRateCents: number,
  totalEarnedCents: number,
  completedJobs: number,
  failedJobs: number,
  successRate: number,
  tokenHash?: string,
  lastHeartbeatAt?: Date,
  trustScore: number,
  createdAt: Date,
  updatedAt: Date
}
```

## `jobs`

```ts
{
  _id: ObjectId,
  title: string,
  type: "python" | string,
  status: "queued" | "running" | "completed" | "failed",
  machineId: ObjectId,
  source: string,
  stdout: string,
  stderr: string,
  exitCode?: number | null,
  budgetCents: number,
  jobCostCents?: number,
  providerPayoutCents?: number,
  platformFeeCents?: number,
  startedAt?: Date,
  completedAt?: Date,
  actualRuntimeSeconds?: number,
  proofHash?: string,
  failureReason?: string,
  error?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## `jobevents`

```ts
{
  _id: ObjectId,
  jobId: ObjectId,
  machineId?: ObjectId,
  type: string,
  message: string,
  createdAt: Date,
  updatedAt: Date
}
```

## `ledgerentries`

```ts
{
  _id: ObjectId,
  jobId: ObjectId,
  machineId?: ObjectId,
  type: "job_charge" | "provider_payout" | "machine_payout" | "platform_fee" | "refund",
  amountCents: number,
  status: "pending" | "captured" | "settled" | "voided",
  createdAt: Date,
  updatedAt: Date
}
```

## Notes

- Consumers are expected to choose a `machineId` when creating a job.
- Producers poll for work already assigned to their machine; there is no backend scheduler in this MVP.
- Lifecycle APIs mutate the job document directly rather than writing an `assignments` collection.
- Store internal IDs as `ObjectId` in Atlas and convert them to strings at API boundaries.
