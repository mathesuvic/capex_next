// app/api/capex/subplans/[id]/values/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

type Ctx = { params: { id: string } };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    // pegue o id via params (assinatura correta do App Router)
    let subplanId = Number(params?.id);

    // fallback: extrai do path caso params venha vazio por algum motivo
    if (!Number.isFinite(subplanId)) {
      const parts = new URL(req.url).pathname.split('/');
      // .../subplans/{id}/values -> penúltimo segmento
      subplanId = Number(parts[parts.length - 2]);
    }

    if (!Number.isFinite(subplanId)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const { month, type, value } = await req.json();

    const mv = await prisma.monthlyValue.upsert({
      where: { subplanId_month_type: { subplanId, month: Number(month), type: String(type) } },
      update: { value: Number(value) || 0 },
      create: { subplanId, month: Number(month), type: String(type), value: Number(value) || 0 },
    });

    return NextResponse.json(mv);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'erro interno' }, { status: 500 });
  }
}
