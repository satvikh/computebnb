import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { formatProvider, getDbUnavailablePayload } from "@/lib/marketplace";
import { Provider } from "@/lib/models";

const schema = z.object({
  providerId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const input = schema.parse(await request.json());

    const provider = await Provider.findByIdAndUpdate(
      input.providerId,
      { $set: { lastHeartbeatAt: new Date() } },
      { new: true }
    );

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (provider.status !== "busy") {
      provider.status = "online";
      await provider.save();
    }

    return NextResponse.json({ provider: formatProvider(provider) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to process heartbeat" }, { status: 500 });
  }
}
