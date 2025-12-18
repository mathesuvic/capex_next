// app/capex/page.tsx
import { CapexTable } from "@/components/capex-table";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, AUTH_COOKIE } from "@/lib/jwt";

export const dynamic = "force-dynamic"; // evita cache/SSR estático
export const revalidate = 0;
export const runtime = "nodejs"; // opcional

export default async function CapexPage() {
  // Autenticação no servidor
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const auth = await verifyToken(token);
  if (!auth) {
    redirect("/login?next=/capex");
  }

  // Se quiser restringir por papel:
  // if (auth.role !== "ADMIN" && auth.role !== "EDITOR") redirect("/");

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-full">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#00823B] flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <h1 className="text-4xl font-bold text-[#00823B]">CAPEX 2025</h1>
          </div>
          <p className="text-slate-600 ml-15">
            Planejamento de Capex da Neoenergia Coelba
          </p>
        </div>

        {/* Conteúdo principal */}
        <CapexTable />
      </div>
    </main>
  );
}
