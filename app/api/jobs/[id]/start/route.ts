import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Job, JobEvent, Machine } from "@/lib/models";
import { formatJob, getDbUnavailablePayload } from "@/lib/marketplace";
import { requireProvider } from "@/lib/provider-auth";

const schema = z.object({
  machineId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json().catch(() => ({})));
    const machineId = input.machineId ?? input.providerId;
    if (!machineId) {
      return NextResponse.json({ error: "machineId is required" }, { status: 400 });
    }

    const auth = await requireProvider(request, machineId);
    if (auth.response) return auth.response;

    const startedAt = new Date();
    const job = await Job.findByIdAndUpdate(
      { _id: id, machineId },
      { $set: { status: "running", startedAt } },
      { new: true }
    );
    if (!job) {
      return NextResponse.json({ error: "Job not found for machine" }, { status: 404 });
    }

    await Machine.findByIdAndUpdate(machineId, {
      $set: { status: "busy", lastHeartbeatAt: startedAt },
    });

    await JobEvent.create({
      jobId: id,
      machineId,
      type: "started",
      message: "Machine started execution",
    });

    return NextResponse.json({ job: formatJob(job, auth.provider?.name ?? null) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid start payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }
}
