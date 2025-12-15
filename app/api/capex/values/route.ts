// app/api/capex/values/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export const runtime = "nodejs"

type Body = {
  month: number
  value: number | string
  label: string
}

const monthColumnMap: Record<number, string> = {
  1: "jan_ano",
  2: "fev_ano",
  3: "mar_ano",
  4: "abr_ano",
  5: "mai_ano",
  6: "jun_ano",
  7: "jul_ano",
  8: "ago_ano",
  9: "set_ano",
  10: "out_ano",
  11: "nov_ano",
  12: "dez_ano",
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<Body>

    if (!body?.label) {
      return NextResponse.json({ error: "O 'label' (nome do capex) é obrigatório." }, { status: 400 })
    }
    if (typeof body.month !== "number" || !Number.isInteger(body.month)) {
      return NextResponse.json({ error: "O 'month' deve ser um número inteiro (1-12)." }, { status: 400 })
    }
    const columnName = monthColumnMap[body.month]
    if (!columnName) {
      return NextResponse.json({ error: "Mês inválido. Use valores de 1 a 12." }, { status: 400 })
    }

    const valueNum =
      typeof body.value === "string" ? Number(body.value) : typeof body.value === "number" ? body.value : NaN
    if (!Number.isFinite(valueNum)) {
      return NextResponse.json({ error: "O 'value' deve ser numérico." }, { status: 400 })
    }

    const updated = await prisma.capexWeb.update({
      where: { capex: body.label },
      data: { [columnName]: valueNum },
    })

    return NextResponse.json(
      { success: true, updatedCapex: updated.capex, column: columnName, value: valueNum },
      { status: 200 }
    )
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "CAPEX não encontrado para o label informado." }, { status: 404 })
    }
    console.error("PUT /api/capex/values erro:", e)
    const errorMessage = e instanceof Error ? e.message : "Erro interno desconhecido"
    return NextResponse.json({ error: "internal", details: errorMessage }, { status: 500 })
  }
}
