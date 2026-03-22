//lib/notifications.ts
import { prisma } from "@/lib/prisma";

type NotificationType = "GLOBAL" | "USER_SPECIFIC" | "ADMIN_ONLY";

interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  userId?: string; // obrigatório quando type === "USER_SPECIFIC"
}

export async function createNotification({
  title,
  message,
  type,
  userId,
}: CreateNotificationParams) {
  return await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      userId: userId ?? null,
      updatedAt: new Date(),
    },
  });
}
