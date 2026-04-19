import { NextResponse } from "next/server";
import { getDbUnavailablePayload, listJobsSummary } from "@/lib/marketplace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobs = await listJobsSummary({ machineId: id });
    return NextResponse.json({ jobs });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to load machine jobs" }, { status: 500 });
  }
}
