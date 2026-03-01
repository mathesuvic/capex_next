// app/api/carimbos/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Seed executado apenas se a tabela estiver vazia
const CARIMBOS_PADRAO = [
  "Plano Verão",
  "Contingência Térmica",
  "Projetos Especiais",
  "Pacote IV",
  "Qualidade do Produto",
  "Nível de Tensão",
  "DEC",
  "FEC",
  "TMAE",
  "Perdas Técnicas",
  "Perdas",
  "Veículos",
  "Infraestrutura",
  "Melhoramento BT",
  "Expansão de Redes",
  "Expansão de Linhas",
  "Expansão de SE",
]

async function ensureSeed() {
  const count = await prisma.carimbo.count()
  if (count === 0) {
    await prisma.carimbo.createMany({
      data: CARIMBOS_PADRAO.map((nome, idx) => ({
        nome,
        ordem: idx,
        ativo: true,
      })),
      skipDuplicates: true,
    })
  }
}

// ── GET — lista carimbos ativos ───────────────────────────────────────────────
export async function GET() {
  try {
    await ensureSeed()

    const carimbos = await prisma.carimbo.findMany({
      where  : { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      select : { id: true, nome: true, ordem: true },
    })

    return NextResponse.json({ ok: true, data: carimbos })
  } catch (e) {
    console.error("[GET /api/carimbos]", e)
    return NextResponse.json({ ok: false, error: "Erro ao listar carimbos" }, { status: 500 })
  }
}

// ── POST — cria novo carimbo ──────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const nome = (body?.nome ?? "").trim()

    if (!nome) {
      return NextResponse.json({ ok: false, error: "Campo 'nome' é obrigatório" }, { status: 400 })
    }

    const carimbo = await prisma.carimbo.create({
      data: { nome, ativo: true, ordem: body?.ordem ?? 999 },
    })

    return NextResponse.json({ ok: true, data: carimbo }, { status: 201 })
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Já existe um carimbo com esse nome" }, { status: 409 })
    }
    console.error("[POST /api/carimbos]", e)
    return NextResponse.json({ ok: false, error: "Erro ao criar carimbo" }, { status: 500 })
  }
}

// ── PATCH — edita carimbo existente ──────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const id   = Number(body?.id)

    if (!id || isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (typeof body.nome  === "string")  data.nome  = body.nome.trim()
    if (typeof body.ativo === "boolean") data.ativo = body.ativo
    if (typeof body.ordem === "number")  data.ordem = body.ordem

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    const updated = await prisma.carimbo.update({ where: { id }, data })
    return NextResponse.json({ ok: true, data: updated })
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ ok: false, error: "Carimbo não encontrado" }, { status: 404 })
    }
    console.error("[PATCH /api/carimbos]", e)
    return NextResponse.json({ ok: false, error: "Erro ao atualizar carimbo" }, { status: 500 })
  }
}

// ── DELETE — soft delete (desativa) ──────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get("id"))

    if (!id || isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 })
    }

    await prisma.carimbo.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ ok: false, error: "Carimbo não encontrado" }, { status: 404 })
    }
    console.error("[DELETE /api/carimbos]", e)
    return NextResponse.json({ ok: false, error: "Erro ao remover carimbo" }, { status: 500 })
  }
}
