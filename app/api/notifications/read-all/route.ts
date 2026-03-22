// app/api/notifications/read-all/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: userId, role } = user

    // Monta o filtro igual ao GET de notifications
    const whereConditions: any[] = [
      { type: "GLOBAL",        read: false },
      { type: "USER_SPECIFIC", read: false, userId },
    ]

    if (role === "ADMIN") {
      whereConditions.push({ type: "ADMIN_ONLY", read: false, userId })
    }

    await prisma.notification.updateMany({
      where: {
        OR: whereConditions,
      },
      data: {
        read     : true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[PATCH /api/notifications/read-all]", e)
    return NextResponse.json({ error: "Erro ao marcar notificações como lidas" }, { status: 500 })
  }
}
