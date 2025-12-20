import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Meses e colunas
const monthLabels = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const
const monthCols = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"] as const

const toNumber = (v: unknown) => {
  if (v === null || v === undefined) return 0
  const s = typeof v === "string" ? v : (v as any).toString?.() ?? String(v)
  const n = parseFloat(s.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

// Mapeia status do banco -> status do front-end
const statusMap: Record<string, "pending" | "approved" | "rejected"> = {
  pendente: "pending",
  aprovado: "approved",
  rejeitado: "rejected",
}

export async function PATCH(req: Request) {
  try {
    const { id, action } = await req.json()

    const map: Record<string, "aprovado" | "rejeitado"> = {
      approve: "aprovado",
      reject: "rejeitado",
    }

    const newStatus = map[action]
    if (!id || !newStatus) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    const updated = await prisma.solicitacaoRecursos.update({
      where: { id },
      data: { status_solicitacao: newStatus },
      select: { id: true, status_solicitacao: true },
    })

    return NextResponse.json({ ok: true, id: updated.id, status: updated.status_solicitacao })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }
}




// GET: lista solicitações (cada linha = 1 solicitação)
export async function GET() {
  try {
    const rows = await prisma.solicitacaoRecursos.findMany({
      orderBy: { createdAt: "desc" },
    })

    const data = rows.map((r) => {
      const seasonalization = monthCols
        .map((col, idx) => {
          const value = toNumber((r as any)[col])
          return value > 0 ? { month: monthLabels[idx], value } : null
        })
        .filter(Boolean) as { month: string; value: number }[]

      const rawStatus = String((r as any).status_solicitacao ?? "").toLowerCase()

      return {
        id: r.id,
        investmentPlan: r.plano_investimento,
        value: toNumber(r.valor_aporte),
        physicals: [
          {
            description: r.desc_fisico,
            justification: r.justificativa,
          },
        ],
        seasonalization,
        status: statusMap[rawStatus] ?? "pending",
        createdAt: r.createdAt.toISOString(),
        requestedBy: r.email_solicitante,
      }
    })

    return NextResponse.json({ data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao listar solicitações" }, { status: 500 })
  }
}

// POST: insere solicitações (uma linha por Físico)
type SeasonalItem = { month: string; value: number }
type PhysicalDTO = {
  plan: string
  description: string
  justification: string
  amount: number
  seasonalization: SeasonalItem[]
}
type MonthColsObj = {
  jan: string; fev: string; mar: string; abr: string; mai: string; jun: string;
  jul: string; ago: string; set: string; out: string; nov: string; dez: string;
}
const monthColumnMap: Record<string, keyof MonthColsObj> = {
  Janeiro: "jan",
  Fevereiro: "fev",
  Março: "mar",
  Abril: "abr",
  Maio: "mai",
  Junho: "jun",
  Julho: "jul",
  Agosto: "ago",
  Setembro: "set",
  Outubro: "out",
  Novembro: "nov",
  Dezembro: "dez",
}
const toDecStr = (n: number | undefined) => (Number.isFinite(n) ? (n as number).toFixed(2) : "0.00")

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email: string | undefined = body.email
    const physicals: PhysicalDTO[] = body.physicals

    if (!email) return NextResponse.json({ error: "email_solicitante é obrigatório" }, { status: 400 })
    if (!Array.isArray(physicals) || physicals.length === 0)
      return NextResponse.json({ error: "Lista de físicos inválida" }, { status: 400 })

    const rows = physicals.map((p) => {
      const months: MonthColsObj = {
        jan: "0.00", fev: "0.00", mar: "0.00", abr: "0.00", mai: "0.00", jun: "0.00",
        jul: "0.00", ago: "0.00", set: "0.00", out: "0.00", nov: "0.00", dez: "0.00",
      }
      for (const s of p.seasonalization) {
        const key = monthColumnMap[s.month]
        if (key) months[key] = toDecStr(s.value)
      }
      return {
        plano_investimento: p.plan,
        valor_aporte: toDecStr(p.amount),
        desc_fisico: p.description,
        justificativa: p.justification,
        email_solicitante: email,
        status_solicitacao: "pendente", // status padrão
        ...months,
      }
    })

    const result = await prisma.solicitacaoRecursos.createMany({ data: rows })
    return NextResponse.json({ ok: true, inserted: result.count })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao salvar solicitação" }, { status: 500 })
  }
}
