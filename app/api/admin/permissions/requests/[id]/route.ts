//app/api/admin/permissions/requests/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'cookie';
import { verifyToken } from '@/lib/jwt';
import { isAdminEmail } from '@/lib/auth';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  // CORREÇÃO FINAL: Usando 'await' em context.params, como esta versão exige.
  const { id } = await context.params; 

  try {
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'ID da solicitação é inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Cookie não encontrado' }, { status: 401 });
    }
    
    const cookies = parse(cookieHeader);
    const token = cookies.auth;
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação não encontrado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const email = (payload as any)?.email;
    if (!email) {
      return NextResponse.json({ error: 'Token inválido ou sem email' }, { status: 401 });
    }

    const me = await prisma.user.findUnique({ where: { email } });
    if (!me || (me.role !== 'ADMIN' && !isAdminEmail(me.email))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedRequest = await prisma.permissionRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        decidedAt: new Date(),
        decidedByUserId: me.id,
      },
    });

    return NextResponse.json(updatedRequest);

  } catch (err: any) {
    console.error(`Erro em PATCH /api/admin/permissions/requests/${id}:`, err.message);
    if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro no servidor', details: err.message }, { status: 500 });
  }
}
