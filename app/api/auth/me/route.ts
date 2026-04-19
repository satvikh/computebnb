import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await readSessionUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
