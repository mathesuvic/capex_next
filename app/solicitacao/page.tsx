// app/solicitacao/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth' // Importando a função que você me enviou
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SolicitacaoForm } from './SolicitacaoForm' // O formulário que será criado abaixo

export default async function SolicitacaoPage() {
  // 1. Busca o usuário logado no servidor
  const user = await getCurrentUser()

  // 2. Se não houver usuário ou e-mail, redireciona para a página de login
  if (!user || !user.email) {
    // Redireciona para o login, e após logar, volta para esta página
    redirect('/login?callbackUrl=/solicitacao')
  }

  // 3. Renderiza a página, incluindo o cabeçalho e o formulário
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho da página */}
        <div className="mb-8">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-primary hover:text-green-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Voltar ao Portal</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Aprovações de Recursos</h1>
          </div>
          <p className="text-muted-foreground text-base ml-12">
            Solicite aprovação de recursos para seus planos de investimento
          </p>
        </div>

        {/* 4. Renderiza o formulário, passando o e-mail do usuário como uma propriedade */}
        <SolicitacaoForm userEmail={user.email} />
      </div>
    </main>
  )
}
