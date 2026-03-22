//app/api/notifications/read-all/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: userId, role } = session.user as { id: string; role: string };

  await prisma.notification.updateMany({
    where: {
      OR: [
        { type: "GLOBAL" },
        { type: "ADMIN_ONLY", ...(role === "ADMIN" ? {} : { id: "none" }) },
        { type: "USER_SPECIFIC", userId },
      ],
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
