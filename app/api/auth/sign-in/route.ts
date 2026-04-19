import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models";
import { formatUser, writeSessionUser } from "@/lib/session";
import { generateSolanaWallet, requestInitialConsumerAirdrop } from "@/lib/solana";

const schema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    role: z.enum(["consumer", "producer"]),
  })
  .refine((input) => input.email || input.username, {
    message: "email or username is required",
    path: ["email"],
  });

export async function POST(request: Request) {
  try {
    await dbConnect();
    const input = schema.parse(await request.json());
    const identityFilter = input.email
      ? { email: input.email }
      : { username: input.username };

    let user = await User.findOne(identityFilter);
    if (!user) {
      let walletAddress: string | undefined;
      let walletSecretKey: string | undefined;
      let walletNetwork: string | undefined;
      let initialAirdropSignature: string | undefined;

      if (input.role === "consumer") {
        const wallet = generateSolanaWallet();
        walletAddress = wallet.walletAddress;
        walletSecretKey = wallet.walletSecretKey;
        walletNetwork = wallet.walletNetwork;
        try {
          initialAirdropSignature = await requestInitialConsumerAirdrop(wallet.walletAddress);
        } catch {
          initialAirdropSignature = undefined;
        }
      }

      user = await User.create({
        ...identityFilter,
        displayName: input.displayName ?? input.username ?? input.email,
        role: input.role,
        walletAddress,
        walletSecretKey,
        walletNetwork,
        initialAirdropSignature,
        totalSpentCents: 0,
      });
    } else if (user.role !== input.role || (input.displayName && user.displayName !== input.displayName)) {
      user.role = input.role;
      if (input.displayName) {
        user.displayName = input.displayName;
      }
      if (user.role === "consumer" && !user.walletAddress) {
        const wallet = generateSolanaWallet();
        user.walletAddress = wallet.walletAddress;
        user.walletSecretKey = wallet.walletSecretKey;
        user.walletNetwork = wallet.walletNetwork;
        try {
          user.initialAirdropSignature = await requestInitialConsumerAirdrop(wallet.walletAddress);
        } catch {
          user.initialAirdropSignature = undefined;
        }
      }
      await user.save();
    }

    await writeSessionUser(user);

    return NextResponse.json({ user: formatUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid sign-in payload", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
