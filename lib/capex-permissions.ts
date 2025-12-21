// lib/capex-permissions.ts
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow, isAdminEmail } from "@/lib/auth";

export async function requireCapexPermissionForLabel(capexLabel: string) {
  const me = await getCurrentUserOrThrow();

  // Admin sempre pode
  const isAdmin = me.role === "ADMIN" || isAdminEmail(me.email);
  if (isAdmin) return me;

  // Se quiser que EDITOR edite tudo, libere aqui:
  if (me.role === "EDITOR") return me;

  // Permissão específica por label
  const perm = await prisma.capexPermission.findUnique({
    where: { userId_capexLabel: { userId: me.id, capexLabel } },
    select: { id: true },
  });

  if (!perm) {
    const err = new Error("FORBIDDEN");
    (err as any).status = 403;
    throw err;
  }

  return me;
}
