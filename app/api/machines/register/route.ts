import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Machine, User } from "@/lib/models";
import { formatMachine } from "@/lib/mvp";
import { generateSolanaWallet } from "@/lib/solana";

const schema = z.object({
  producerUserId: z.string().min(1),
  name: z.string().min(1),
  cpu: z.string().min(1),
  gpu: z.string().min(1),
  ramGb: z.coerce.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const input = schema.parse(await request.json());
    const producer = await User.findOne({ _id: input.producerUserId, role: "producer" });
    if (!producer) {
      return NextResponse.json({ error: "Producer user not found" }, { status: 404 });
    }

    const existingMachine = await Machine.findOne({ producerUserId: producer._id });
    const wallet = existingMachine?.walletAddress
      ? null
      : generateSolanaWallet();

    const machine = await Machine.findOneAndUpdate(
      { producerUserId: producer._id },
      {
        $set: {
          name: input.name,
          cpu: input.cpu,
          gpu: input.gpu,
          ramGb: input.ramGb,
        },
        $setOnInsert: {
          status: "inactive",
          producerUserId: producer._id,
          hourlyRateCents: 300,
          totalEarnedCents: 0,
          walletAddress: wallet?.walletAddress,
          walletSecretKey: wallet?.walletSecretKey,
          walletNetwork: wallet?.walletNetwork,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({ machine: formatMachine(machine) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid machine registration payload", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to register machine" }, { status: 500 });
  }
}
