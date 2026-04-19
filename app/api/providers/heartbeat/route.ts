import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { formatProvider, getDbUnavailablePayload } from "@/lib/marketplace";
import { Job, Machine } from "@/lib/models";
import { requireProvider } from "@/lib/provider-auth";

const schema = z.object({
  machineId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const input = schema.parse(await request.json());
    const machineId = input.machineId ?? input.providerId;
    if (!machineId) {
      return NextResponse.json({ error: "machineId is required" }, { status: 400 });
    }

    const auth = await requireProvider(request, machineId);
    if (auth.response) return auth.response;

    const hasRunningJob = await Job.exists({ machineId, status: "running" });
    const machine = await Machine.findByIdAndUpdate(
      machineId,
      {
        $set: {
          lastHeartbeatAt: new Date(),
          status: hasRunningJob ? "busy" : "online",
        },
      },
      { new: true }
    );

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const payload = formatProvider(machine);

    return NextResponse.json({ provider: payload, machine: payload });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid heartbeat payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to process heartbeat" }, { status: 500 });
  }
}
