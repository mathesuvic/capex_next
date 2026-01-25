import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'cookie';
import { verifyToken } from '@/lib/jwt';
import { isAdminEmail } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    if (!me || (me.role !== 'ADMIN' && !isAdminEmail(me.email))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const items = await prisma.permissionRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { 
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
