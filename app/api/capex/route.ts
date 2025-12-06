import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { order: "asc" },
      include: {
        subplans: {
          orderBy: { order: "asc" },
          include: {
            values: true,
            outgoing: { include: { to: true } },
          },
        },
      },
    })

    const rows: any[] = []
    for (const plan of plans) {
      rows.push({
        label: plan.label,
        color: plan.color ?? null,
        cells: Array.from({ length: 12 }, (_, i) => ({
          value: 0,
          type: i < 10 ? "realizado" : "previsto",
        })),
      })

      for (const s of plan.subplans) {
        const cells = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1
          const type = i < 10 ? "realizado" : "previsto"
          const mv = s.values.find(v => v.month === month && v.type === type)
          return { value: mv?.value ?? 0, type }
        })

        rows.push({
          id: s.id,
          label: s.label,
          sublevel: 1,
          meta: s.meta,
          transfers: s.outgoing.map(t => ({
            id: t.id,
            amount: t.amount,
            toId: t.toSubplanId,
            to: t.to.label,
          })),
          cells,
        })
      }
    }

    return NextResponse.json(rows)
  } catch (e) {
    console.error(e)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
