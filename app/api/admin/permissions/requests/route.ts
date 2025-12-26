// app/api/admin/permissions/requests/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'cookie';
import { verifyToken } from '@/lib/jwt';
import { isAdminEmail } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
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

    // CORREÇÃO: 'permissionrequest' minúsculo e 'include' com o nome da relação correta
    const items = await prisma.permissionrequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        user_permissionrequest_userIdTouser: {
          select: { email: true, name: true },
        },
      },
    });

    return NextResponse.json(items);
  } catch (err: any) {
    console.error('Erro em GET /api/admin/permissions/requests:', err.message);
    return NextResponse.json({ error: 'unauthorized', details: err.message }, { status: 401 });
  }
}
