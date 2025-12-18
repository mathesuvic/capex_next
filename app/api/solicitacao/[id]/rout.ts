import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, canEditPlan } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const s = await prisma.solicitacao.findUnique({ where: { id: params.id }, select: { id: true, planId: true } });
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allowed = await canEditPlan(user.id, s.planId);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.solicitacao.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ ok: true, data: updated });
}
