import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Job, JobEvent } from "@/lib/models";
import { formatJob, getDbUnavailablePayload, listJobsSummary } from "@/lib/marketplace";
import { assignNextJob } from "@/lib/scheduling";

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["text_generation", "image_caption", "embedding", "shell_demo"]),
  input: z.string().min(1),
  requiredCapabilities: z.array(z.string()).optional(),
  runnerPayload: z.record(z.unknown()).optional(),
  budgetCents: z.coerce.number().int().positive().optional(),
});

export async function GET() {
  try {
    const jobs = await listJobsSummary();
    return NextResponse.json({ jobs });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const contentType = request.headers.get("content-type") ?? "";
    const raw = contentType.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());

    const input = schema.parse(raw);

    const job = await Job.create({
      title: input.title,
      type: input.type,
      input: input.input,
      requiredCapabilities: input.requiredCapabilities ?? capabilitiesForType(input.type),
      runnerPayload: input.runnerPayload,
      budgetCents: input.budgetCents ?? 500,
      status: "queued"
    });

    await JobEvent.create({
      jobId: job._id,
      type: "created",
      message: "Job queued from web app"
    });

    await assignNextJob();

    if (contentType.includes("application/json")) {
      return NextResponse.json({ job: formatJob(job) }, { status: 201 });
    }

    return NextResponse.redirect(new URL(`/jobs/${job._id}/results`, request.url), { status: 303 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    throw error;
  }
}

function capabilitiesForType(type: z.infer<typeof schema>["type"]) {
  if (type === "shell_demo") return ["cpu", "docker"];
  if (type === "embedding" || type === "text_generation") return ["cpu", "node"];
  return ["cpu"];
}
