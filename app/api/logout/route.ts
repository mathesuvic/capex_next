// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/jwt";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).delete(AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
