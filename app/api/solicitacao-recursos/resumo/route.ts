// app/api/solicitacao-recursos/resumo/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// --- Constantes e Tipos ---
const monthCols = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const
type MonthKey = (typeof monthCols)[number]
type StatusDB = "pendente" | "aprovado" | "rejeitado"
type StatusFront = "pending" | "approved" | "rejected"
type StatusParamFront = "all" | StatusFront
const toNumber = (v: unknown): number => { if (v === null || v === undefined) return 0; const s = typeof v === "string" ? v : (v as any).toString?.() ?? String(v); const n = parseFloat(s.replace(",", ".")); return Number.isFinite(n) ? n : 0 }
const statusDbToFront: Record<StatusDB, StatusFront> = { pendente: "pending", aprovado: "approved", rejeitado: "rejected" }
const statusFrontToDb: Record<StatusFront, StatusDB> = { pending: "pendente", approved: "aprovado", rejected: "rejeitado" }

// --- Rota da API ---
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const statusParam = (url.searchParams.get("status") || "all") as StatusParamFront
    const where = statusParam === "all" ? undefined : { status_solicitacao: statusFrontToDb[statusParam] }

    const solicitacoes = await prisma.solicitacaoRecursos.findMany({ where, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, plano_investimento: true, valor_aporte: true, desc_fisico: true, justificativa: true, email_solicitante: true, status_solicitacao: true, jan: true, fev: true, mar: true, abr: true, mai: true, jun: true, jul: true, ago: true, set: true, out: true, nov: true, dez: true }})
    const plansDetails = await prisma.subplan.findMany({ select: { plano_investimento: true, tipo: true, natureza: true } })

    const planDetailsMap = new Map<string, { tipo: string; natureza: string }>()
    for (const plan of plansDetails) {
      if (plan.plano_investimento) {
        planDetailsMap.set(plan.plano_investimento, { tipo: plan.tipo || "N/A", natureza: plan.natureza || "N/A" })
      }
    }

    const requests = solicitacoes.map((solicitacao) => {
      const details = planDetailsMap.get(solicitacao.plano_investimento)
      const monthlyDistribution = monthCols.reduce((acc, month) => {
        acc[month] = toNumber((solicitacao as any)[month])
        return acc
      }, {} as Record<MonthKey, number>)

      return {
        id: solicitacao.id,
        type: details?.tipo || "N/A",
        natureza: details?.natureza || "N/A",
        desc_fisico: solicitacao.desc_fisico || "",
        investmentPlan: solicitacao.plano_investimento,
        totalValue: toNumber(solicitacao.valor_aporte),
        status: statusDbToFront[solicitacao.status_solicitacao as StatusDB] ?? ("pending" as const),
        requestDate: solicitacao.createdAt.toISOString(),
        requestedBy: solicitacao.email_solicitante,
        monthlyDistribution,
      }
    })

    return NextResponse.json({
      ok: true,
      requests,
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error("Erro na API de resumo:", e)
    return NextResponse.json({ ok: false, error: "Erro interno ao gerar resumo" }, { status: 500 })
  }
}
