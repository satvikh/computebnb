import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Job, Machine, User } from "@/lib/models";
import { formatJob, listUserJobs } from "@/lib/mvp";

const schema = z.object({
  consumerUserId: z.string().min(1),
  machineId: z.string().min(1),
  code: z.string().min(1),
  filename: z.string().min(1).optional(),
  timeoutSeconds: z.coerce.number().int().positive().optional(),
  budgetCents: z.coerce.number().int().positive().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerUserId = searchParams.get("consumerUserId");
    const jobs = await listUserJobs(consumerUserId);
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const input = schema.parse(await request.json());

    const [consumer, machine] = await Promise.all([
      User.findOne({ _id: input.consumerUserId, role: "consumer" }),
      Machine.findById(input.machineId),
    ]);

    if (!consumer) {
      return NextResponse.json({ error: "Consumer user not found" }, { status: 404 });
    }
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    if (machine.status === "inactive") {
      return NextResponse.json({ error: "Machine is inactive" }, { status: 409 });
    }

    const job = await Job.create({
      consumerUserId: consumer._id,
      machineId: machine._id,
      status: "queued",
      code: input.code,
      filename: input.filename,
      timeoutSeconds: input.timeoutSeconds,
      budgetCents: input.budgetCents ?? 500,
      stdout: "",
      stderr: "",
      exitCode: null,
    });

    return NextResponse.json({ job: formatJob(job, machine.name) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid job payload", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
