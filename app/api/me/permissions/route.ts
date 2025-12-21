// app/api/me/permissions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow, isAdminEmail } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUserOrThrow();

    if (user.role === "ADMIN" || isAdminEmail(user.email)) {
      return NextResponse.json({ isAdmin: true, allowedLabels: "ALL" }, { status: 200 });
    }

    const perms = await prisma.capexPermission.findMany({
      where: { userId: user.id },
      select: { capexLabel: true },
    });

    return NextResponse.json({ isAdmin: false, allowedLabels: perms.map((p) => p.capexLabel) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
