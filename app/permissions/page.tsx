// app/home/permissions/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE } from "@/lib/jwt";
import PermissionRequestForm from "./permission-requests-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PermissionsPage() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) redirect("/login?next=/home/permissions");

  try {
    await verifyToken(token);
  } catch {
    redirect("/login?next=/home/permissions");
  }

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-3xl">
        <Link href="/home" className="text-slate-600 hover:text-slate-900">
          ← Voltar
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Solicitação de permissões</h1>
        <p className="mt-2 text-slate-600">
          Solicite acesso para editar um plano específico do CAPEX.
        </p>

        <div className="mt-6">
          <PermissionRequestForm />
        </div>
      </div>
    </main>
  );
}
