// app/gerenciar-solicitacao/[id]/page.tsx

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
// Importe aqui qualquer componente de UI que você esteja usando.

type PageProps = {
  params: {
    id: string;
  };
};

export default async function GerenciarSolicitacaoPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // CORREÇÃO: Usando a relação 'requester' como definido no schema.prisma
  const request = await prisma.permissionRequest.findUnique({
    where: { id: params.id },
    include: {
      requester: { // <<< MUDANÇA AQUI: de 'user' para 'requester'
        select: {
          name: true,
          email: true,
        }
      }
    }
  });

  if (!request) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold">Solicitação não encontrada</h1>
        <p>A solicitação com o ID fornecido não foi encontrada.</p>
      </div>
    );
  }

  // Opcional: Adicionar regra de autorização.
  // Ex: se o usuário não for admin E não for o dono da solicitação, redirecione.
  if (user.role !== 'ADMIN' && user.id !== request.userId) {
     redirect('/unauthorized'); // ou para uma página de "acesso negado"
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Solicitação</h1>
      
      <div className="mt-4 border rounded-lg p-4 max-w-2xl">
          <p className="mb-2"><strong>CAPEX Label:</strong> {request.capexLabel}</p>
          <p className="mb-2"><strong>Status:</strong> {request.status}</p>
          {/* CORREÇÃO: Acessando os dados através de 'requester' */}
          <p className="mb-2"><strong>Solicitante:</strong> {request.requester.name} ({request.requester.email})</p> {/* <<< MUDANÇA AQUI */}
          <p className="mb-2"><strong>Motivo da Solicitação:</strong> {request.reason || 'Nenhum motivo informado'}</p>
          <p><strong>Data da Solicitação:</strong> {new Date(request.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
      </div>

    </div>
  );
}
