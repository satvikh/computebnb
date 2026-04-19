import { NextResponse } from "next/server";
import { getDbUnavailablePayload, listMachinesSummary } from "@/lib/marketplace";

export async function GET() {
  try {
    const machines = await listMachinesSummary();
    return NextResponse.json({ machines });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to load machines" }, { status: 500 });
  }
}
