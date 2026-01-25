import { Suspense } from 'react';
import LoginForm from './login-form';

// Componente simples para mostrar enquanto o formulário carrega
function LoadingFallback() {
  // Você pode colocar um spinner ou um layout skeleton aqui
  return <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100">Carregando...</div>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
