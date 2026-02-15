// app/admin/permissions/page.tsx

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE } from "@/lib/jwt";
import AdminPermissionRequests from "./requests";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPermissionsPage() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) redirect("/login?next=/admin/permissions");

  try {
    await verifyToken(token);
  } catch {
    redirect("/login?next=/admin/permissions");
  }

  return (
    <main className="min-h-screen bg-white p-6">
      {/* ESTE DIV CONTÉM A CLASSE QUE LIMITA A LARGURA */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Aprovar solicitações</h1>
        <p className="mt-2 text-slate-600">Somente administradores.</p>
        <div className="mt-6">
          <AdminPermissionRequests />
        </div>
      </div>
    </main>
  );
}
