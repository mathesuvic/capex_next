// app/api/me/permissions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow, isAdminEmail } from "@/lib/auth";

// Força a rota a ser dinâmica e nunca usar cache.
export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUserOrThrow();

    if (user.role === "ADMIN" || isAdminEmail(user.email)) {
      return NextResponse.json({ isAdmin: true, allowedLabels: "ALL" }, { status: 200 });
    }

    // Agora esta linha vai funcionar pois o modelo foi corrigido no schema
    const perms = await prisma.CapexPermission.findMany({
      where: { userId: user.id },
      select: { capexLabel: true },
    });

    return NextResponse.json({ isAdmin: false, allowedLabels: perms.map((p) => p.capexLabel) }, { status: 200 });
  } catch (error) {
    console.error("ERRO na rota /api/me/permissions:", error);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}