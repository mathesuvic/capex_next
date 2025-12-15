// app/api/capex/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

/**
 * @description Busca todos os dados de CAPEX e anexa as transferências relacionadas de forma eficiente.
 */
export async function GET() {
  try {
    const [capexItems, allTransfers] = await Promise.all([
      prisma.capexWeb.findMany({
        orderBy: { ordem: "asc" },
      }),
      prisma.transfer.findMany({
        include: {
          from: { select: { capex: true } },
          to: { select: { capex: true } },
        },
      }),
    ])

    // Indexa transferências por label de origem (id é Int)
    const transfersByFromLabel = new Map<string, Array<{ id: number; amount: number; to: string }>>()

    for (const transfer of allTransfers) {
      const fromLabel = transfer.from?.capex
      const toLabel = transfer.to?.capex
      if (!fromLabel || !toLabel) continue

      if (!transfersByFromLabel.has(fromLabel)) {
        transfersByFromLabel.set(fromLabel, [])
      }
      transfersByFromLabel.get(fromLabel)!.push({
        id: transfer.id,
        amount: Number(transfer.amount) || 0,
        to: toLabel,
      })
    }

    const monthMapping = [
      "jan_ano", "fev_ano", "mar_ano", "abr_ano", "mai_ano", "jun_ano",
      "jul_ano", "ago_ano", "set_ano", "out_ano", "nov_ano", "dez_ano",
    ] as const

    let planoCount = 0
    const planoColors = ["bg-blue-50", "bg-green-50", "bg-yellow-50"] as const

    const finalData = capexItems.map((dbRow) => {
      const isSubLevel = dbRow.plano?.startsWith("sub")
      const isPlano = dbRow.plano === "plano"

      const cells = monthMapping.map((key, index) => ({
        type: index < 10 ? "realizado" : "previsto",
        value: Number((dbRow as any)[key]) || 0,
      }))

      return {
        // PK é o próprio label (capex)
        id: dbRow.capex,
        label: dbRow.capex,
        sublevel: isSubLevel ? 1 : undefined,
        color: isPlano ? planoColors[planoCount++ % planoColors.length] : undefined,
        cells,
        meta: Number((dbRow as any).meta) || 0,
        transfers: transfersByFromLabel.get(dbRow.capex) || [],
      }
    })

    return NextResponse.json(finalData, { status: 200 })
  } catch (e) {
    console.error("GET /api/capex erro:", e)
    const errorMessage = e instanceof Error ? e.message : "Erro interno desconhecido"
    return NextResponse.json({ error: "internal", details: errorMessage }, { status: 500 })
  }
}
