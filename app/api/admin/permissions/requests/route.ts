// app/api/admin/permissions/requests/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserOrThrow, isAdminEmail } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Rota para BUSCAR (GET) todas as solicitações de permissão com status PENDING.
 */
export async function GET(req: Request) {
  try {
    const me = await getCurrentUserOrThrow();

    if (me.role !== 'ADMIN' && !isAdminEmail(me.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.permissionRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        requester: {
          select: { email: true, name: true },
        },
      },
    });

    return NextResponse.json(items);
  } catch (err: any) {
    console.error('Erro em GET /api/admin/permissions/requests:', err.message);
    return NextResponse.json({ error: 'Unauthorized', details: err.message }, { status: 401 });
  }
}
