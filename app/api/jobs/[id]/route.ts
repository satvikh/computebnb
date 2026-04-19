import { NextResponse } from "next/server";
import { getJobById } from "@/lib/mvp";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "Failed to load job" }, { status: 500 });
  }
}
