import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Job, Machine, User } from "@/lib/models";

export async function GET() {
  try {
    await dbConnect();

    const [userCount, machineCount, jobCount] = await Promise.all([
      User.countDocuments(),
      Machine.countDocuments(),
      Job.countDocuments(),
    ]);

    return NextResponse.json({
      status: "ok",
      db: "connected",
      userCount,
      machineCount,
      jobCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", db: "disconnected", error: message },
      { status: 503 }
    );
  }
}
