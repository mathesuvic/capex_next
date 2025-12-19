'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextUrl = sp.get('next') || sp.get('from') || '/home';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, next: nextUrl }),
        credentials: 'same-origin',
        redirect: 'manual',
      });

      if (res.status === 303 || res.status === 307) {
        router.replace(nextUrl);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Credenciais inválidas');
      }

      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        const data = await res.json();
        router.replace(data?.redirectTo || nextUrl || '/home');
      } else {
        router.replace(nextUrl || '/home');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <div className="mt-8 w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="email" className="font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@neoenergia.com"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="font-semibold">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <button
              type="button"
              className="text-[#00823B]"
              onClick={() => router.push('/register')}
              disabled={loading}
            >
              Criar conta
            </button>
            <button
              type="button"
              className="text-slate-600"
              onClick={() => router.push('/reset')}
              disabled={loading}
            >
              Esqueci minha senha
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-md font-semibold bg-[#00823B] hover:bg-[#00732E]"
          >
            {loading ? 'Entrando...' : 'Entrar no Portal'}
          </Button>
        </form>
      </div>
    </main>
  );
}
