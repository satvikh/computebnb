import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Job, Machine } from "@/lib/models";
import { formatJob } from "@/lib/mvp";

function runningJobIsStale(job: {
  startedAt?: Date | null;
  timeoutSeconds?: number | null;
}) {
  if (!job.startedAt) {
    return true;
  }

  const timeoutSeconds = Math.max(30, job.timeoutSeconds ?? 60);
  const staleAfterMs = (timeoutSeconds + 30) * 1000;
  return Date.now() - new Date(job.startedAt).getTime() > staleAfterMs;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const machine = await Machine.findById(id).lean();
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const runningJob = await Job.findOne({ machineId: id, status: "running" })
      .sort({ startedAt: -1, createdAt: -1 });

    if (runningJob) {
      if (runningJobIsStale(runningJob)) {
        runningJob.status = "failed";
        runningJob.completedAt = new Date();
        runningJob.stderr =
          runningJob.stderr ||
          "Job was marked failed because the producer lost track of a running execution.";
        runningJob.exitCode = runningJob.exitCode ?? 1;
        await runningJob.save();
        await Machine.findByIdAndUpdate(id, { $set: { status: "active" } });
      } else {
        if (machine.status !== "busy") {
          await Machine.findByIdAndUpdate(id, { $set: { status: "busy" } });
        }
        return NextResponse.json({ job: null });
      }
    } else if (machine.status === "busy") {
      await Machine.findByIdAndUpdate(id, { $set: { status: "active" } });
    }

    const job = await Job.findOne({ machineId: id, status: "queued" })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      job: job ? formatJob(job, machine.name) : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch next job" }, { status: 500 });
  }
}
