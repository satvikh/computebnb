import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Job, Machine } from "@/lib/models";
import { formatJob } from "@/lib/mvp";

const schema = z.object({
  machineId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json().catch(() => ({})));

    const startedAt = new Date();
    const job = await Job.findByIdAndUpdate(
      { _id: id, machineId: input.machineId, status: "queued" },
      { $set: { status: "running", startedAt } },
      { returnDocument: "after" }
    );
    if (!job) {
      return NextResponse.json({ error: "Queued job not found for machine" }, { status: 404 });
    }

    await Machine.findByIdAndUpdate(input.machineId, {
      $set: { status: "busy" },
    });

    const machine = await Machine.findById(input.machineId).lean();
    return NextResponse.json({ job: formatJob(job, machine?.name ?? null) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid start payload", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }
}

export { POST as PATCH };
