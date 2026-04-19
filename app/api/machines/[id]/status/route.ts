import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Machine } from "@/lib/models";
import { formatMachine } from "@/lib/mvp";

const schema = z.object({
  status: z.enum(["active", "inactive", "busy"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const input = schema.parse(await request.json());
    const machine = await Machine.findByIdAndUpdate(
      id,
      { $set: { status: input.status } },
      { returnDocument: "after" }
    );

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    return NextResponse.json({ machine: formatMachine(machine) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid machine status payload", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to update machine status" }, { status: 500 });
  }
}

export { PATCH as POST };
