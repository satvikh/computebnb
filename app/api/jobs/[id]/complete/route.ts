import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Job, Machine, User } from "@/lib/models";
import { formatJob } from "@/lib/mvp";
import { recordCompletedJobLedger } from "@/lib/ledger";
import { calculateRuntimePricing } from "@/lib/pricing";
import {
  SOLANA_CENTS_PER_SOL,
  centsToLamports,
  generateSolanaWallet,
  transferDevnetSol,
} from "@/lib/solana";

const schema = z.object({
  machineId: z.string().min(1),
  stdout: z.string().default(""),
  stderr: z.string().default(""),
  exitCode: z.coerce.number().int().default(0),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json());

    const [job, machine] = await Promise.all([
      Job.findOne({ _id: id, machineId: input.machineId }),
      Machine.findById(input.machineId)
    ]);
    if (!job) {
      return NextResponse.json({ error: "Job not found for machine" }, { status: 404 });
    }
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    if (job.status === "completed") {
      return NextResponse.json({ job: formatJob(job, machine.name) });
    }
    if (job.status === "failed") {
      return NextResponse.json({ error: "Cannot complete a failed job" }, { status: 409 });
    }

    const consumer = await User.findOne({ _id: job.consumerUserId, role: "consumer" });
    if (!consumer) {
      return NextResponse.json({ error: "Consumer user not found" }, { status: 404 });
    }

    if (!consumer.walletAddress || !consumer.walletSecretKey) {
      return NextResponse.json({ error: "Consumer wallet not configured" }, { status: 409 });
    }

    if (!machine.walletAddress || !machine.walletSecretKey) {
      const wallet = generateSolanaWallet();
      machine.walletAddress = wallet.walletAddress;
      machine.walletSecretKey = wallet.walletSecretKey;
      machine.walletNetwork = wallet.walletNetwork;
    }

    const completedAt = new Date();
    const startedAt = job.startedAt ?? completedAt;
    const runtimeSeconds = Math.max(
      1,
      Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
    );
    const pricing = calculateRuntimePricing({
      runtimeSeconds,
      hourlyRateCents: machine.hourlyRateCents,
      budgetCents: job.budgetCents,
    });

    const solanaPaymentLamports = centsToLamports(pricing.jobCostCents);
    let solanaPaymentSignature: string | null = null;
    let solanaPaymentStatus: "pending" | "settled" | "failed" = "pending";
    try {
      solanaPaymentSignature = await transferDevnetSol({
        fromSecretKey: consumer.walletSecretKey,
        toWalletAddress: machine.walletAddress,
        lamports: solanaPaymentLamports,
      });
      solanaPaymentStatus = "settled";
    } catch {
      solanaPaymentStatus = "failed";
    }

    job.status = "completed";
    job.startedAt = startedAt;
    job.stdout = input.stdout;
    job.stderr = input.stderr;
    job.exitCode = input.exitCode;
    job.completedAt = completedAt;
    job.actualRuntimeSeconds = runtimeSeconds;
    job.jobCostCents = pricing.jobCostCents;
    job.providerPayoutCents = pricing.providerPayoutCents;
    job.platformFeeCents = pricing.platformFeeCents;
    job.solanaPaymentLamports = solanaPaymentLamports;
    job.solanaPaymentSignature = solanaPaymentSignature;
    job.solanaPaymentStatus = solanaPaymentStatus;
    job.solanaCentsPerSol = SOLANA_CENTS_PER_SOL;
    await job.save();

    machine.status = "active";
    await machine.save();

    await recordCompletedJobLedger({
      jobId: job._id,
      machineId: machine._id,
      consumerUserId: consumer._id,
      budgetCents: pricing.jobCostCents,
      providerPayoutCents: pricing.providerPayoutCents,
      platformFeeCents: pricing.platformFeeCents,
      solanaLamports: solanaPaymentLamports,
      solanaSignature: solanaPaymentSignature ?? undefined,
      fromWalletAddress: consumer.walletAddress,
      toWalletAddress: machine.walletAddress,
      solanaCentsPerSol: SOLANA_CENTS_PER_SOL,
    });

    consumer.totalSpentCents += pricing.jobCostCents;
    await consumer.save();

    return NextResponse.json({ job: formatJob(job, machine.name) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid completion payload", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to complete job" }, { status: 500 });
  }
}

export { POST as PATCH };
