import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromLabel, toLabel, amount } = body;

    if (!fromLabel || !toLabel || amount === undefined) {
      return NextResponse.json({ error: "Dados incompletos para criar transferência." }, { status: 400 });
    }

    const newTransfer = await db.transfer.create({
      data: {
        amount: amount,
        from: {
          connect: { capex: fromLabel }
        },
        to: {
          connect: { capex: toLabel }
        }
      }
    });

    return NextResponse.json(newTransfer, { status: 201 });

  } catch (e) {
    console.error(`POST /api/capex/transfers erro:`, e);
    const errorMessage = e instanceof Error ? e.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'internal', details: errorMessage }, { status: 500 });
  }
}
