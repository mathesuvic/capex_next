// app/home/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Capex Portal</h1>
          </div>
          <p className="text-muted-foreground text-lg ml-13">Bem-vindo de volta! Escolha uma opção para começar</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Planejamento Capex → /capex */}
          <Link href="/capex" className="group cursor-pointer block">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Planejamento Capex</h2>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Acesse o planejamento de despesas de capital e gerencie seus projetos
              </p>
              <span className="w-full text-center bg-primary text-white font-semibold py-2 px-4 rounded-lg group-hover:bg-green-700 transition-colors">
                Acessar
              </span>
            </div>
          </Link>

          {/* Card 2: Tabela Capex → /capex */}
          <Link href="/capex" className="group cursor-pointer block">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Tabela de Capex</h2>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Visualize e analise dados detalhados de capital expenditure
              </p>
              <span className="w-full text-center bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Acessar
              </span>
            </div>
          </Link>

          {/* Card 3: Relatórios */}
          <div className="group cursor-pointer">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Relatórios</h2>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Gere relatórios executivos e análises de desempenho
              </p>
              <button className="w-full bg-accent text-foreground font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">
                Acessar
              </button>
            </div>
          </div>

          {/* Card 4: solicitacao */}
          <a href="/solicitacao" className="group cursor-pointer block">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Aprovações</h2>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Gerencie solicitações de aprovação de projetos e budgets
              </p>
              <button className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Acessar
              </button>
            </div>
          </a>

          {/* Card 5: Gerenciar Solicitações */}
          <a href="/gerenciar-solicitacao" className="group cursor-pointer block">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Gerenciar Solicitações</h2>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Visualize, aprove ou rejeite solicitações de recursos
              </p>
              <button className="w-full bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Acessar
              </button>
            </div>
          </a>

          {/* Card 6: permissao */}
          <Link href="/home/permissions" className="group cursor-pointer block">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Permissão</h2>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Solicite permissão para edição dos subplanos
              </p>
              <span className="w-full text-center bg-accent text-foreground font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">
                Acessar
              </span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">© 2025 Neoenergia. Todos os direitos reservados.</p>
          <button className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
            Sair
          </button>
        </div>
      </div>
    </main>
  );
}
