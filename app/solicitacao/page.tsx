// app/solicitacao/page.tsx
import { redirect }        from "next/navigation"
import { getCurrentUser }  from "@/lib/auth"
import Link                from "next/link"
import { ArrowLeft }       from "lucide-react"
import { SolicitacaoForm } from "./SolicitacaoForm"
import prisma              from "@/lib/prisma"

// Carimbos padrão usados como fallback caso a API/DB falhe
const CARIMBOS_PADRAO = [
  "Plano Verão","Contingência Térmica","Projetos Especiais","Pacote IV",
  "Qualidade do Produto","Nível de Tensão","DEC","FEC","TMAE",
  "Perdas Técnicas","Perdas","Veículos","Infraestrutura",
  "Melhoramento BT","Expansão de Redes","Expansão de Linhas","Expansão de SE",
]

export default async function SolicitacaoPage() {
  const user = await getCurrentUser()

  if (!user || !user.email) {
    redirect("/login?callbackUrl=/solicitacao")
  }

  // ── Busca planos de investimento ────────────────────────────────────────────
  const plansData = await prisma.capexWeb.findMany({
    where  : { plano: "subplano" },
    select : { capex: true },
    distinct: ["capex"],
    orderBy: { capex: "asc" },
  })
  const investmentPlans = plansData.map((item) => item.capex)

  // ── Busca carimbos ativos — com seed automático e fallback ─────────────────
  let carimbosData: { id: number; nome: string }[] = []
  try {
    // Seed automático se a tabela estiver vazia
    const count = await prisma.carimbo.count()
    if (count === 0) {
      await prisma.carimbo.createMany({
        data: CARIMBOS_PADRAO.map((nome, idx) => ({ nome, ordem: idx, ativo: true })),
        skipDuplicates: true,
      })
    }

    carimbosData = await prisma.carimbo.findMany({
      where  : { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      select : { id: true, nome: true },
    })
  } catch (e) {
    // Fallback: se o model ainda não existir no banco (antes da migration),
    // usa a lista estática para não quebrar a página
    console.warn("[SolicitacaoPage] Tabela carimbos indisponível, usando fallback estático.", e)
    carimbosData = CARIMBOS_PADRAO.map((nome, idx) => ({ id: idx + 1, nome }))
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* ── Cabeçalho ── */}
        <div className="mb-8">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-primary hover:text-green-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Voltar ao Portal</span>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Aprovações de Recursos</h1>
          </div>

          <p className="text-muted-foreground text-base ml-12">
            Solicite aprovação de recursos para seus planos de investimento
          </p>
        </div>

        {/* ── Formulário ── */}
        <SolicitacaoForm
          userEmail={user.email}
          plans={investmentPlans}
          carimbos={carimbosData}
        />
      </div>
    </main>
  )
}
