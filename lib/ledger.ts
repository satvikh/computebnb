import type { Types } from "mongoose";
import { LedgerEntry, Machine } from "@/lib/models";

export async function recordCompletedJobLedger(input: {
  jobId: Types.ObjectId | string;
  machineId: Types.ObjectId | string;
  budgetCents: number;
  providerPayoutCents: number;
  platformFeeCents: number;
}) {
  await LedgerEntry.updateOne(
    { jobId: input.jobId, type: "job_charge" },
    {
      $setOnInsert: {
        jobId: input.jobId,
        amountCents: input.budgetCents,
        status: "captured"
      }
    },
    { upsert: true }
  );

  const payout = await LedgerEntry.updateOne(
    { jobId: input.jobId, type: "provider_payout" },
    {
      $setOnInsert: {
        jobId: input.jobId,
        machineId: input.machineId,
        amountCents: input.providerPayoutCents,
        status: "pending"
      }
    },
    { upsert: true }
  );

  await LedgerEntry.updateOne(
    { jobId: input.jobId, type: "platform_fee" },
    {
      $setOnInsert: {
        jobId: input.jobId,
        machineId: input.machineId,
        amountCents: input.platformFeeCents,
        status: "captured"
      }
    },
    { upsert: true }
  );

  if (payout.upsertedCount > 0) {
    await Machine.findByIdAndUpdate(input.machineId, {
      $inc: { totalEarnedCents: input.providerPayoutCents }
    });
  }
}
