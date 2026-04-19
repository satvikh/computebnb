import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { formatJob, getDbUnavailablePayload } from "@/lib/marketplace";
import { Job, Machine } from "@/lib/models";
import { requireProvider } from "@/lib/provider-auth";

function buildAssignment(jobId: string, machineId: string, createdAt: Date, startedAt?: Date | null) {
  return {
    id: `job-${jobId}`,
    jobId,
    providerId: machineId,
    status: startedAt ? "running" : "assigned",
    startedAt: startedAt ?? null,
    completedAt: null,
    createdAt,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const auth = await requireProvider(request, id);
    if (auth.response) return auth.response;

    const [machine, runningJob, queuedJob] = await Promise.all([
      Machine.findById(id),
      Job.findOne({ machineId: id, status: "running" }).sort({ startedAt: 1 }).lean(),
      Job.findOne({ machineId: id, status: "queued" }).sort({ createdAt: 1 }).lean(),
    ]);

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const job = runningJob ?? queuedJob;

    machine.lastHeartbeatAt = new Date();
    machine.status = runningJob ? "busy" : "online";
    await machine.save();

    if (!job) {
      return NextResponse.json({ assignment: null, job: null });
    }

    return NextResponse.json({
      assignment: buildAssignment(
        String(job._id),
        String(job.machineId),
        job.createdAt,
        job.startedAt ?? null
      ),
      job: formatJob(job, machine.name),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to poll for machine work" }, { status: 500 });
  }
}
