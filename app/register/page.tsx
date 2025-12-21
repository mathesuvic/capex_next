// app/register/page.tsx
import Link from "next/link";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header (mesmo estilo da Home) */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Capex Portal</h1>
          </div>
          <p className="text-muted-foreground text-lg ml-12">
            Crie sua conta para acessar o sistema
          </p>
        </div>

        {/* Card central */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna esquerda (texto) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-2">Cadastro</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Preencha seus dados para criar a conta. Após o cadastro, você será autenticado
                automaticamente.
              </p>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Acesso rápido</p>
                    <p>Cadastre e já entre com cookie seguro (HTTP Only).</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 11c0 3.866-3.582 7-8 7a9.985 9.985 0 01-4-.8L4 11l-1-4a9.985 9.985 0 014-.8c4.418 0 8 3.134 8 7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Dados protegidos</p>
                    <p>Senha armazenada com hash, não em texto puro.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Já tem conta? Entrar
                </Link>

                <Link
                  href="/"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar
                </Link>
              </div>
            </div>
          </div>

          {/* Coluna direita (form) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Criar conta</h3>
                  <p className="text-sm text-muted-foreground">
                    Informe nome, email e senha para concluir.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 10-8 0v3H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2V7z"
                    />
                  </svg>
                </div>
              </div>

              <RegisterForm />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 mt-10 border-t border-border">
          <p className="text-muted-foreground text-sm">
            © 2025 Neoenergia. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground text-sm">
            Precisa de ajuda? Fale com o suporte.
          </p>
        </div>
      </div>
    </main>
  );
}
