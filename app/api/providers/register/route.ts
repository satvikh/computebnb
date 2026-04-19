import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { calculateSuccessRate, formatProvider, getDbUnavailablePayload } from "@/lib/marketplace";
import { Provider } from "@/lib/models";
import crypto from "crypto";

const schema = z.object({
  name: z.string().min(1),
  capabilities: z.array(z.string()).optional(),
  hourlyRateCents: z.coerce.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const input = schema.parse(body);

    const token = `tok_${crypto.randomBytes(16).toString("hex")}`;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const provider = await Provider.create({
      name: input.name,
      capabilities: input.capabilities ?? ["cpu", "node"],
      hourlyRateCents: input.hourlyRateCents ?? 250,
      status: "online",
      lastHeartbeatAt: new Date(),
      successRate: calculateSuccessRate(0, 0),
      tokenHash
    });

    return NextResponse.json({
      provider: {
        ...formatProvider(provider),
        token
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to register provider" }, { status: 500 });
  }
}
