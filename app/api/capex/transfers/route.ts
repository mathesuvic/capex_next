// app/api/capex/transfers/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// Criar transferência
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fromLabel, toLabel, amount } = body as {
      fromLabel?: string
      toLabel?: string
      amount?: number
    }

    if (!fromLabel || !toLabel || amount === undefined) {
      return NextResponse.json(
        { error: "Dados incompletos para criar transferência." },
        { status: 400 }
      )
    }

    const newTransfer = await prisma.transfer.create({
      data: {
        amount,
        from: { connect: { capex: fromLabel } },
        to: { connect: { capex: toLabel } },
      },
    })

    return NextResponse.json(newTransfer, { status: 201 })
  } catch (e) {
    console.error("POST /api/capex/transfers erro:", e)
    const errorMessage = e instanceof Error ? e.message : "Erro interno desconhecido"
    return NextResponse.json({ error: "internal", details: errorMessage }, { status: 500 })
  }
}

// Atualizar transferência (id Int)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, amount, toLabel } = body as {
      id?: number | string
      amount?: number
      toLabel?: string
    }

    const parsedId = typeof id === "string" ? Number(id) : id
    if (!parsedId || !Number.isInteger(parsedId)) {
      return NextResponse.json(
        { error: "ID da transferência é obrigatório e deve ser inteiro." },
        { status: 400 }
      )
    }

    if (!toLabel) {
      return NextResponse.json(
        { error: "O destino (toLabel) é obrigatório para atualizar." },
        { status: 400 }
      )
    }

    const updatedTransfer = await prisma.transfer.update({
      where: { id: parsedId },
      data: {
        ...(amount !== undefined ? { amount } : {}),
        to: { connect: { capex: toLabel } },
      },
    })

    return NextResponse.json(updatedTransfer, { status: 200 })
  } catch (e) {
    console.error("PUT /api/capex/transfers erro:", e)
    const errorMessage = e instanceof Error ? e.message : "Erro interno desconhecido"
    return NextResponse.json({ error: "internal", details: errorMessage }, { status: 500 })
  }
}

// Deletar transferência (id Int)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get("id")
    const id = idParam ? Number(idParam) : NaN

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "ID da transferência é obrigatório e deve ser inteiro." },
        { status: 400 }
      )
    }

    await prisma.transfer.delete({ where: { id } })

    return NextResponse.json({ message: "Transferência deletada com sucesso." }, { status: 200 })
  } catch (e) {
    console.error("DELETE /api/capex/transfers erro:", e)
    const errorMessage = e instanceof Error ? e.message : "Erro interno desconhecido"
    return NextResponse.json({ error: "internal", details: errorMessage }, { status: 500 })
  }
}
