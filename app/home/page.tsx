// app/home/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/LogoutButton";

// ─── types ───────────────────────────────────────────────────────────────────

type ColorKey = "green" | "blue" | "orange";

type CardItem = {
  href: string;
  title: string;
  description: string;
  color: ColorKey;
  tag: string;
  icon: React.ReactNode;
};

type ColorConfig = {
  bg: string;
  iconBg: string;
  iconText: string;
  badge: string;
  badgeText: string;
  btn: string;
  btnHover: string;
  border: string;
  accent: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function getFirstName(fullName?: string | null): string {
  if (!fullName?.trim()) return "Usuário";
  return fullName.trim().split(/\s+/)[0];
}

function getRoleLabel(role: string): string {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}

// ─── data ────────────────────────────────────────────────────────────────────

const cards: CardItem[] = [
  {
    href: "/capex",
    title: "Planejamento Capex",
    description: "Acesse o planejamento de despesas de capital e gerencie seus projetos",
    color: "green",
    tag: "Planejamento",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/capex",
    title: "Tabela de Capex",
    description: "Visualize e analise dados detalhados de capital expenditure",
    color: "blue",
    tag: "Análise",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/permissions/",
    title: "Aprovação de Subplanos",
    description: "Aprove as permissões para edição nos subplanos",
    color: "orange",
    tag: "Aprovação",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/solicitacao",
    title: "Aprovações",
    description: "Gerencie solicitações de aprovação de projetos e budgets",
    color: "green",
    tag: "Gestão",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/gerenciar-solicitacao",
    title: "Gerenciar Solicitações",
    description: "Visualize, aprove ou rejeite solicitações de recursos",
    color: "blue",
    tag: "Gestão",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/permissions",
    title: "Permissão",
    description: "Solicite permissão para edição dos subplanos",
    color: "orange",
    tag: "Acesso",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const colorMap: Record<ColorKey, ColorConfig> = {
  green: {
    bg:        "from-green-50/60 to-white",
    iconBg:    "bg-green-100",
    iconText:  "text-primary",
    badge:     "bg-green-100",
    badgeText: "text-primary",
    btn:       "bg-primary",
    btnHover:  "hover:bg-green-700",
    border:    "hover:border-primary/40",
    accent:    "bg-primary",
  },
  blue: {
    bg:        "from-blue-50/60 to-white",
    iconBg:    "bg-blue-100",
    iconText:  "text-secondary",
    badge:     "bg-blue-100",
    badgeText: "text-secondary",
    btn:       "bg-secondary",
    btnHover:  "hover:bg-blue-600",
    border:    "hover:border-secondary/40",
    accent:    "bg-secondary",
  },
  orange: {
    bg:        "from-orange-50/60 to-white",
    iconBg:    "bg-orange-100",
    iconText:  "text-accent",
    badge:     "bg-orange-100",
    badgeText: "text-accent",
    btn:       "bg-accent",
    btnHover:  "hover:bg-orange-500",
    border:    "hover:border-accent/40",
    accent:    "bg-accent",
  },
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const firstName    = getFirstName(user.name);
  const roleLabel    = getRoleLabel(user.role);
  const avatarLetter = firstName.charAt(0).toUpperCase();
  const isAdmin      = user.role === "ADMIN";

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
            <span className="text-primary border-b-2 border-primary pb-0.5 cursor-pointer">Início</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Relatórios</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Configurações</span>
          </nav>

          {/* Direita */}
          <div className="flex items-center gap-3">

            {/* Notificação */}
            <button className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>

            {/* Avatar + nome */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow">
                {avatarLetter}
              </div>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-xs font-semibold text-foreground">{firstName}</span>
                <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
              </div>
            </div>

            {/* ✅ Botão Sair — chama POST /api/logout */}
            <LogoutButton />

          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-green-600 to-green-800 text-white px-10 py-10 mb-10 shadow-lg">
          <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-24 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-96 h-96 bg-white/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                  ● Sistema Ativo
                </span>
                {isAdmin && (
                  <span className="bg-yellow-400/20 text-yellow-200 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm border border-yellow-300/20">
                    ★ Admin
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
                Olá, {firstName}! 👋
              </h1>
              <p className="text-green-100 text-base max-w-lg">
                Plataforma centralizada de gestão de capital. Selecione um módulo abaixo para começar.
              </p>
            </div>

            {/* KPIs */}
            <div className="flex gap-4 shrink-0">
              {[
                { label: "Projetos Ativos", value: "128" },
                { label: "Pendentes",       value: "14"  },
                { label: "Aprovados",       value: "96"  },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center border border-white/10 min-w-[90px]"
                >
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-green-100 text-xs mt-1">{kpi.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Módulos do Sistema</h2>
            <p className="text-sm text-muted-foreground">
              Acesse as funcionalidades disponíveis para o seu perfil
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-white border border-border rounded-full px-3 py-1 shadow-sm">
            {cards.length} módulos disponíveis
          </span>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const c = colorMap[card.color];
            return (
              <Link key={`${card.href}-${card.title}`} href={card.href} className="group block">
                <div className={`
                  relative bg-gradient-to-br ${c.bg}
                  rounded-2xl border border-border ${c.border}
                  shadow-sm hover:shadow-lg
                  transition-all duration-300 hover:-translate-y-1
                  p-7 h-full flex flex-col overflow-hidden
                `}>
                  {/* Barra accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${c.accent} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl ${c.iconBg} ${c.iconText} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge} ${c.badgeText}`}>
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">
                    {card.description}
                  </p>

                  <div className={`
                    w-full ${c.btn} ${c.btnHover}
                    text-white text-sm font-semibold
                    py-2.5 px-4 rounded-xl
                    flex items-center justify-center gap-2
                    transition-all duration-200 group-hover:shadow-md
                  `}>
                    Acessar
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
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
