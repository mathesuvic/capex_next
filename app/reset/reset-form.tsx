'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'next/navigation';

export default function ResetPage() {
  const sp = useSearchParams();
  const token = sp.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function requestReset() {
    const res = await fetch('/api/auth/reset/request', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMsg(`Se existir, enviaremos um link. Em dev: token=${data.devToken ?? 'enviado por email'}`);
  }
  async function confirmReset() {
    const res = await fetch('/api/auth/reset/confirm', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ token, password }),
    });
    setMsg(res.ok ? 'Senha alterada. Faça login.' : 'Falha ao redefinir senha.');
  }

  if (token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Input type="password" placeholder="Nova senha" value={password} onChange={e=>setPassword(e.target.value)} />
          <Button onClick={confirmReset}>Atualizar senha</Button>
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Input type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <Button onClick={requestReset}>Enviar link de redefinição</Button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </main>
  );
}
