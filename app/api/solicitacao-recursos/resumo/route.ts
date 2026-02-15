// app/api/solicitacao-recursos/resumo/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// --- Constantes e Tipos ---
const monthCols = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const
type MonthKey = (typeof monthCols)[number]

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"] as const

type StatusDB = "pendente" | "aprovado" | "rejeitado"
type StatusFront = "pending" | "approved" | "rejected"
type StatusParamFront = "all" | StatusFront

// --- Funções Helper ---
const toNumber = (v: unknown): number => {
  if (v === null || v === undefined) return 0
  const s = typeof v === "string" ? v : (v as any).toString?.() ?? String(v)
  const n = parseFloat(s.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

const emptyMonths = (): Record<MonthKey, number> => ({ jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0, jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0 })

const statusDbToFront: Record<StatusDB, StatusFront> = { pendente: "pending", aprovado: "approved", rejeitado: "rejected" }
const statusFrontToDb: Record<StatusFront, StatusDB> = { pending: "pendente", approved: "aprovado", rejected: "rejeitado" }

// --- Rota da API ---
export async function GET(req: Request) {
  try {
    // 1. Processar Parâmetros da Requisição
    const url = new URL(req.url)
    const statusParam = (url.searchParams.get("status") || "all") as StatusParamFront
    const where = statusParam === "all" ? undefined : { status_solicitacao: statusFrontToDb[statusParam] }

    // 2. Buscar Dados do Banco
    // Busca as solicitações de recursos
    const solicitacoes = await prisma.solicitacaoRecursos.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, createdAt: true, plano_investimento: true, valor_aporte: true, desc_fisico: true,
        justificativa: true, email_solicitante: true, status_solicitacao: true, jan: true, fev: true,
        mar: true, abr: true, mai: true, jun: true, jul: true, ago: true, set: true, out: true, nov: true, dez: true,
      },
    })
    
    // Busca os detalhes dos subplanos (tipo, natureza) para enriquecer os dados
    const plansDetails = await prisma.subplan.findMany({
      select: { plano_investimento: true, tipo: true, natureza: true },
    })

    // 3. Preparar Dados para Processamento
    // Cria um mapa para acesso rápido aos detalhes do plano (melhor performance que um find dentro do loop)
    const planDetailsMap = new Map<string, { tipo: string; natureza: string }>()
    for (const plan of plansDetails) {
      if (plan.plano_investimento) {
        planDetailsMap.set(plan.plano_investimento, {
          tipo: plan.tipo || "N/A",
          natureza: plan.natureza || "N/A",
        })
      }
    }

    // 4. Formatar a Lista de Solicitações para o Frontend
    // Adiciona o 'tipo' e formata os dados para cada solicitação
    const requests = solicitacoes.map((solicitacao) => {
      const details = planDetailsMap.get(solicitacao.plano_investimento)
      const monthlyDistribution = monthCols.reduce((acc, month) => {
        acc[month] = toNumber((solicitacao as any)[month])
        return acc
      }, {} as Record<MonthKey, number>)

      return {
        id: solicitacao.id,
        type: details?.tipo || "N/A", // Campo adicionado para a tabela
        investmentPlan: solicitacao.plano_investimento,
        totalValue: toNumber(solicitacao.valor_aporte),
        status: statusDbToFront[solicitacao.status_solicitacao as StatusDB] ?? ("pending" as const),
        requestDate: solicitacao.createdAt.toISOString(),
        requestedBy: solicitacao.email_solicitante,
        physicals: [{ description: solicitacao.desc_fisico, justification: solicitacao.justificativa }],
        monthlyDistribution,
      }
    })

    // 5. Calcular Agregações para os Gráficos
    
    // a) Estatísticas gerais (KPIs)
    const stats = requests.reduce((acc, r) => {
      acc.total += r.totalValue
      acc.count += 1
      if (r.status === "approved") { acc.approved += r.totalValue; acc.approvedCount += 1 } 
      else if (r.status === "pending") { acc.pending += r.totalValue; acc.pendingCount += 1 } 
      else { acc.rejected += r.totalValue; acc.rejectedCount += 1 }
      return acc
    }, { total: 0, approved: 0, pending: 0, rejected: 0, count: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 })

    // b) Agregado por Mês
    const monthlyTotalsAll = emptyMonths()
    for (const r of requests) { for (const m of monthCols) { monthlyTotalsAll[m] += r.monthlyDistribution[m] ?? 0 } }
    const monthlyData = monthCols.map((m, idx) => ({ month: monthNames[idx], value: monthlyTotalsAll[m] }))

    // c) Agregados por Plano, Tipo e Natureza
    const planMap = new Map<string, number>()
    const typeMap = new Map<string, number>()
    const natureMap = new Map<string, number>()

    for (const r of requests) {
      // Plano
      planMap.set(r.investmentPlan, (planMap.get(r.investmentPlan) || 0) + r.totalValue)
      // Tipo e Natureza
      const details = planDetailsMap.get(r.investmentPlan)
      if (details) {
        typeMap.set(details.tipo, (typeMap.get(details.tipo) || 0) + r.totalValue)
        natureMap.set(details.natureza, (natureMap.get(details.natureza) || 0) + r.totalValue)
      } else {
        const uncategorized = "Não Categorizado"
        typeMap.set(uncategorized, (typeMap.get(uncategorized) || 0) + r.totalValue)
        natureMap.set(uncategorized, (natureMap.get(uncategorized) || 0) + r.totalValue)
      }
    }
    const planData = Array.from(planMap.entries()).map(([plan, value]) => ({ plan, value }))
    const typeData = Array.from(typeMap.entries()).map(([type, value]) => ({ type, value }))
    const natureData = Array.from(natureMap.entries()).map(([nature, value]) => ({ nature, value }))

    // 6. Enviar a Resposta Completa
    return NextResponse.json({
      ok: true,
      filters: { status: statusParam },
      requests, // Lista detalhada para a tabela
      statistics: stats, // Dados para os KPIs
      monthlyData, // Dados para o gráfico de área
      planData,    // Dados para o gráfico de barras de plano
      typeData,    // Dados para o gráfico de rosca de tipo
      natureData,  // Dados para o gráfico de barras de natureza
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error("Erro na API de resumo:", e)
    return NextResponse.json({ ok: false, error: "Erro interno ao gerar resumo" }, { status: 500 })
  }
}
