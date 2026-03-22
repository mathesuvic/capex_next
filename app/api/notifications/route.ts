// app/api/notifications/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id: userId, role } = user

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { type: "GLOBAL" },
        // ADMIN_ONLY: só traz as que têm o userId do admin logado
        ...(role === "ADMIN" ? [{ type: "ADMIN_ONLY" as const, userId }] : []),
        { type: "USER_SPECIFIC", userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json(notifications)
}
