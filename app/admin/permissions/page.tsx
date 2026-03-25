// app/admin/permissions/page.tsx

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE } from "@/lib/jwt";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NotificationButton } from "@/components/ui/NotificationButton";
import AdminPermissionRequests from "./requests";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPermissionsPage() {
  const jar   = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) redirect("/login?next=/admin/permissions");

  try {
    await verifyToken(token);
  } catch {
    redirect("/login?next=/admin/permissions");
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const firstName    = user.name?.trim().split(/\s+/)[0] ?? "Usuário";
  const avatarLetter = firstName.charAt(0).toUpperCase();
  const roleLabel    = user.role === "ADMIN" ? "Administrador" : "Usuário";

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground tracking-wide">CapEx Portal</span>
              <span className="text-[11px] text-muted-foreground">Neoenergia · Coelba</span>
            </div>
          </div>

          {/* Nav central */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="/home" className="hover:text-foreground cursor-pointer transition-colors">Início</a>
            <span className="hover:text-foreground cursor-pointer transition-colors">Relatórios</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Configurações</span>
          </nav>

          {/* Direita */}
          <div className="flex items-center gap-3">
            <NotificationButton />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow">
                {avatarLetter}
              </div>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-xs font-semibold text-foreground">{firstName}</span>
                <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-green-600 to-green-800 text-white px-10 py-10 mb-10 shadow-lg">
          {/* Decorações */}
          <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-24 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-96 h-96 bg-white/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              {/* Breadcrumb / badge */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                  ● Sistema Ativo
                </span>
                <span className="bg-yellow-400/20 text-yellow-200 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm border border-yellow-300/20">
                  ★ Admin
                </span>
                <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  Gestão · Aprovações
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
                Aprovação de Subplanos
              </h1>
              <p className="text-green-100 text-base max-w-lg">
                Gerencie e aprove as solicitações de permissão de edição enviadas pelos usuários do sistema.
              </p>
            </div>

            {/* Ícone decorativo */}
            <div className="shrink-0 hidden md:flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm shadow-inner">
              <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Breadcrumb trail ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <a href="/home" className="hover:text-primary transition-colors">Início</a>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-foreground font-medium">Aprovação de Subplanos</span>
        </div>

        {/* ── Conteúdo ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">

          {/* Cabeçalho da seção */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 text-primary flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Solicitações Pendentes</h2>
                <p className="text-xs text-muted-foreground">Analise e decida cada solicitação abaixo</p>
              </div>
            </div>

            <span className="text-xs text-muted-foreground bg-[#f4f6f9] border border-border rounded-full px-3 py-1">
              Somente administradores
            </span>
          </div>

          {/* Conteúdo do componente */}
          <div className="p-6">
            <AdminPermissionRequests />
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            © 2025 Neoenergia · Coelba. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Sistema operacional
            </span>
            <span className="hidden md:block">v5.0.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
