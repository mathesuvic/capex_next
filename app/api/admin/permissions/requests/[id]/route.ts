// app/api/admin/permissions/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'cookie';
import { verifyToken } from '@/lib/jwt';
import { isAdminEmail } from '@/lib/auth';

export const runtime = 'nodejs';

type PatchBody = { action: 'approve' | 'reject' };

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) throw new Error('Cookie não encontrado');

    const cookies = parse(cookieHeader);
    const token = cookies.auth;
    if (!token) throw new Error('Token de autenticação não encontrado');

    const payload = await verifyToken(token);
    const email = (payload as any)?.email;
    if (!email) throw new Error('Token inválido ou sem email');

    const me = await prisma.user.findUnique({ where: { email } });
    if (!me) throw new Error('Usuário do token não encontrado no banco');

    const isAdmin = me.role === 'ADMIN' || isAdminEmail(me.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { id } = ctx.params;
    const body = (await req.json().catch(() => ({}))) as Partial<PatchBody>;
    const action = body.action;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action inválida (approve|reject)' }, { status: 400 });
    }

    // CORREÇÃO: 'permissionrequest' minúsculo
    const reqRow = await prisma.permissionrequest.findUnique({
      where: { id },
      select: { id: true, userId: true, capexLabel: true, status: true },
    });

    if (!reqRow) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (reqRow.status !== 'PENDING') {
      return NextResponse.json({ error: 'already_decided', status: reqRow.status }, { status: 400 });
    }

    if (action === 'approve') {
      await prisma.$transaction([
        // CORREÇÃO: 'permissionrequest' minúsculo
        prisma.permissionrequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            decidedAt: new Date(),
            decidedByUserId: me.id,
          },
        }),
        // CORREÇÃO: 'capexpermission' minúsculo
        prisma.capexpermission.upsert({
          where: { userId_capexLabel: { userId: reqRow.userId, capexLabel: reqRow.capexLabel } },
          update: {},
          create: { userId: reqRow.userId, capexLabel: reqRow.capexLabel, id: undefined }, // Prisma 3+ requires undefined for default values
        }),
      ]);

      return NextResponse.json({ ok: true, status: 'APPROVED' }, { status: 200 });
    }

    // reject
    // CORREÇÃO: 'permissionrequest' minúsculo
    await prisma.permissionrequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        decidedAt: new Date(),
        decidedByUserId: me.id,
      },
    });

    return NextResponse.json({ ok: true, status: 'REJECTED' }, { status: 200 });
  } catch (err: any) {
    console.error(`Erro em PATCH /api/admin/permissions/requests/${ctx.params.id}:`, err.message);
    return NextResponse.json({ error: 'unauthorized', details: err.message }, { status: 401 });
  }
}
