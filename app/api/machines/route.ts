import { NextResponse } from "next/server";
import { listMarketplaceMachines } from "@/lib/mvp";

export async function GET() {
  try {
    const machines = await listMarketplaceMachines();
    return NextResponse.json({ machines });
  } catch {
    return NextResponse.json({ error: "Failed to load machines" }, { status: 500 });
  }
}
