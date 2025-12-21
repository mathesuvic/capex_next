// app/api/admin/permissions/requests/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow, isAdminEmail } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const me = await getCurrentUserOrThrow();

    const isAdmin = me.role === "ADMIN" || isAdminEmail(me.email);
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const items = await prisma.permissionRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, name: true } } },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 401;
    return NextResponse.json({ error: "unauthorized" }, { status });
  }
}
