// app/capex/page.tsx
import Link from "next/link";
import { CapexTable } from "@/components/capex-table";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, AUTH_COOKIE } from "@/lib/jwt";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CapexPage() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;

  if (!token) redirect("/login?next=/capex");

  try {
    await verifyToken(token);
  } catch {
    redirect("/login?next=/capex");
  }

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-full">
        {/* Botão no estilo do outro, sem mexer no layout */}
        <div className="mb-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-primary hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Voltar ao Portal</span>
          </Link>
        </div>

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

        <CapexTable />
      </div>
    </main>
  );
}
