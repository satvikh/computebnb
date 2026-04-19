import { cookies } from "next/headers";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models";

export const SESSION_COOKIE = "gpubnb_session";

export interface SessionUser {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  role: "consumer" | "producer";
}

function toSessionUser(user: {
  _id: Types.ObjectId | string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  role: "consumer" | "producer";
}): SessionUser {
  return {
    id: String(user._id),
    email: user.email ?? null,
    username: user.username ?? null,
    displayName: user.displayName ?? null,
    role: user.role,
  };
}

export async function readSessionUser() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }

  await dbConnect();
  const user = await User.findById(sessionId).lean();
  if (!user) {
    return null;
  }

  return toSessionUser(user);
}

export async function writeSessionUser(user: {
  _id: Types.ObjectId | string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  role: "consumer" | "producer";
}) {
  const store = await cookies();
  store.set(SESSION_COOKIE, String(user._id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSessionUser() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function formatUser(user: {
  _id: Types.ObjectId | string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  role: "consumer" | "producer";
}) {
  return toSessionUser(user);
}
