// app/api/solicitacao-recursos/resumo/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const monthCols = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const
type MonthKey = (typeof monthCols)[number]

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const

type StatusDB = "pendente" | "aprovado" | "rejeitado"
type StatusFront = "pending" | "approved" | "rejected"
type StatusParamFront = "all" | StatusFront

const toNumber = (v: unknown) => {
  if (v === null || v === undefined) return 0
  const s = typeof v === "string" ? v : (v as any).toString?.() ?? String(v)
  const n = parseFloat(s.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

const emptyMonths = () =>
  ({
    jan: 0,
    fev: 0,
    mar: 0,
    abr: 0,
    mai: 0,
    jun: 0,
    jul: 0,
    ago: 0,
    set: 0,
    out: 0,
    nov: 0,
    dez: 0,
  }) satisfies Record<MonthKey, number>

const statusDbToFront: Record<StatusDB, StatusFront> = {
  pendente: "pending",
  aprovado: "approved",
  rejeitado: "rejected",
}

const statusFrontToDb: Record<StatusFront, StatusDB> = {
  pending: "pendente",
  approved: "aprovado",
  rejected: "rejeitado",
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const statusParam = (url.searchParams.get("status") || "all") as StatusParamFront

    const where =
      statusParam === "all"
        ? undefined
        : {
            status_solicitacao: statusFrontToDb[statusParam],
          }

    const rows = await prisma.solicitacaoRecursos.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        plano_investimento: true,
        valor_aporte: true,
        desc_fisico: true,
        justificativa: true,
        email_solicitante: true,
        status_solicitacao: true,
        jan: true,
        fev: true,
        mar: true,
        abr: true,
        mai: true,
        jun: true,
        jul: true,
        ago: true,
        set: true,
        out: true,
        nov: true,
        dez: true,
      },
    })

    // 1) Monta lista detalhada (para tabela e gráfico por plano)
    const requests = rows.map((r) => {
      const monthlyDistribution = monthCols.reduce((acc, m) => {
        acc[m] = toNumber((r as any)[m])
        return acc
      }, {} as Record<MonthKey, number>)

      return {
        id: r.id,
        investmentPlan: r.plano_investimento,
        totalValue: toNumber(r.valor_aporte),
        status: statusDbToFront[r.status_solicitacao as StatusDB] ?? ("pending" as const),
        requestDate: r.createdAt.toISOString(),
        requestedBy: r.email_solicitante,
        physicals: [
          {
            description: r.desc_fisico,
            justification: r.justificativa,
          },
        ],
        monthlyDistribution,
      }
    })

    // 2) Estatísticas (KPI)
    const stats = requests.reduce(
      (acc, r) => {
        acc.total += r.totalValue
        acc.count += 1
        if (r.status === "approved") {
          acc.approved += r.totalValue
          acc.approvedCount += 1
        } else if (r.status === "pending") {
          acc.pending += r.totalValue
          acc.pendingCount += 1
        } else {
          acc.rejected += r.totalValue
          acc.rejectedCount += 1
        }
        return acc
      },
      {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        count: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
      }
    )

    // 3) Mensal (bar chart)
    const monthlyTotalsAll = emptyMonths()
    for (const r of requests) {
      for (const m of monthCols) {
        monthlyTotalsAll[m] += r.monthlyDistribution[m] ?? 0
      }
    }

    const monthlyData = monthCols.map((m, idx) => ({
      month: monthNames[idx],
      value: monthlyTotalsAll[m],
    }))

    // 4) Por plano (bar chart)
    const planMap = new Map<string, number>()
    for (const r of requests) {
      planMap.set(r.investmentPlan, (planMap.get(r.investmentPlan) || 0) + r.totalValue)
    }
    const planData = Array.from(planMap.entries()).map(([plan, value]) => ({ plan, value }))

    return NextResponse.json({
      ok: true,
      filters: { status: statusParam },
      requests,
      statistics: stats,
      monthlyData,
      planData,
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, error: "Erro ao gerar resumo" }, { status: 500 })
  }
}
