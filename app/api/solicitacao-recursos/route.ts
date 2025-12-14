import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // agora existe este export

type SeasonalItem = { month: string; value: number }
type PhysicalDTO = {
  plan: string
  description: string
  justification: string
  amount: number
  seasonalization: SeasonalItem[]
}

type MonthCols = {
  jan: string; fev: string; mar: string; abr: string; mai: string; jun: string;
  jul: string; ago: string; set: string; out: string; nov: string; dez: string;
}

const monthColumnMap: Record<string, keyof MonthCols> = {
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

const toDecStr = (n: number | undefined) =>
  Number.isFinite(n) ? (n as number).toFixed(2) : "0.00"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email: string | undefined = body.email
    const physicals: PhysicalDTO[] = body.physicals

    if (!email) return NextResponse.json({ error: "email_solicitante é obrigatório" }, { status: 400 })
    if (!Array.isArray(physicals) || physicals.length === 0)
      return NextResponse.json({ error: "Lista de físicos inválida" }, { status: 400 })

    const rows = physicals.map((p) => {
      const months: MonthCols = {
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
