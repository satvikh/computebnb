import { NextResponse } from "next/server";
import { getDashboardSummary, getDbUnavailablePayload } from "@/lib/marketplace";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to load dashboard summary" }, { status: 500 });
  }
}
