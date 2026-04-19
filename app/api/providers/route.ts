import { NextResponse } from "next/server";
import { getDbUnavailablePayload, listProvidersSummary } from "@/lib/marketplace";

export async function GET() {
  try {
    const providers = await listProvidersSummary();
    return NextResponse.json({ providers });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(getDbUnavailablePayload(), { status: 503 });
    }
    return NextResponse.json({ error: "Failed to load providers" }, { status: 500 });
  }
}
