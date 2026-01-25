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

  // CORREÇÃO: Usando 'permissionRequest' e incluindo dados do usuário relacionado.
  const request = await prisma.permissionRequest.findUnique({
    where: { id: params.id },
    include: {
      user: { // Incluindo os dados do usuário que fez a solicitação
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
      
      {/*
        AVISO: Adapte seu JSX abaixo!
        O objeto 'request' agora contém os dados corretos.
        O campo 'planId' não existe. Use os campos disponíveis:
        - request.id
        - request.capexLabel
        - request.reason
        - request.status
        - request.createdAt
        - request.user.name (nome do solicitante)
        - request.user.email (email do solicitante)
      */}

      {/* Exemplo de como você pode exibir os novos dados */}
      <div className="mt-4 border rounded-lg p-4 max-w-2xl">
          <p className="mb-2"><strong>CAPEX Label:</strong> {request.capexLabel}</p>
          <p className="mb-2"><strong>Status:</strong> {request.status}</p>
          <p className="mb-2"><strong>Solicitante:</strong> {request.user.name} ({request.user.email})</p>
          <p className="mb-2"><strong>Motivo da Solicitação:</strong> {request.reason || 'Nenhum motivo informado'}</p>
          <p><strong>Data da Solicitação:</strong> {new Date(request.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
      </div>

    </div>
  );
}
