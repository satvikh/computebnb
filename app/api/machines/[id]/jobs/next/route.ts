import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Job, Machine } from "@/lib/models";
import { formatJob } from "@/lib/mvp";

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
