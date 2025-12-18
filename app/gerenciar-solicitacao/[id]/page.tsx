import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser, canEditPlan } from '@/lib/auth';

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const s = await prisma.solicitacao.findUnique({
    where: { id: params.id },
    select: { id: true, planId: true },
  });
  if (!s) notFound();

  const allowed = await canEditPlan(user.id, s.planId);
  if (!allowed) redirect('/home');

  return <div>Editor da Solicitação {s.id}</div>;
}
