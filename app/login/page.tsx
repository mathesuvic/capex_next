'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'pulse' | 'exit'>('enter')

  useEffect(() => {
    const pulseTimer = setTimeout(() => setPhase('pulse'), 600)
    const exitTimer = setTimeout(() => setPhase('exit'), 2000)
    const finishTimer = setTimeout(() => onFinish(), 2600)
    return () => {
      clearTimeout(pulseTimer)
      clearTimeout(exitTimer)
      clearTimeout(finishTimer)
    }
  }, [onFinish])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#00823B] transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Glowing ring behind icon */}
      <div
        className={`absolute rounded-full transition-all duration-1000 ${
          phase === 'enter'
            ? 'h-0 w-0 opacity-0'
            : phase === 'pulse'
              ? 'h-48 w-48 opacity-30 md:h-56 md:w-56'
              : 'h-64 w-64 opacity-0 md:h-72 md:w-72'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
        }}
      />

      {/* Icon container */}
      <div
        className={`relative transition-all duration-700 ease-out ${
          phase === 'enter'
            ? 'scale-50 opacity-0'
            : phase === 'pulse'
              ? 'scale-100 opacity-100'
              : 'scale-110 opacity-0'
        }`}
      >
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white/10 p-4 shadow-2xl backdrop-blur-sm md:h-32 md:w-32">
          <Image
            src="/neoenergia-icon-v2.ico"
            alt="Neoenergia"
            width={80}
            height={80}
            className="drop-shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Brand text */}
      <div
        className={`mt-8 text-center transition-all delay-200 duration-700 ${
          phase === 'enter'
            ? 'translate-y-4 opacity-0'
            : phase === 'pulse'
              ? 'translate-y-0 opacity-100'
              : 'translate-y-0 opacity-0'
        }`}
      >
        <h1 className="text-2xl font-bold tracking-wide text-white md:text-3xl">
          Portal Capex
        </h1>
        <p className="mt-2 text-sm font-medium text-white/70">
          Neoenergia
        </p>
      </div>

      {/* Loading dots */}
      <div
        className={`mt-10 flex gap-2 transition-all delay-300 duration-700 ${
          phase === 'enter'
            ? 'opacity-0'
            : phase === 'pulse'
              ? 'opacity-100'
              : 'opacity-0'
        }`}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full bg-white/80"
            style={{
              animation: 'bounce-dot 1.2s infinite ease-in-out',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function LoginFormContent() {
  const router = useRouter()
  const sp = useSearchParams()
  const nextUrl = sp.get('next') || sp.get('from') || '/home'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFormVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, next: nextUrl }),
        credentials: 'same-origin',
        redirect: 'manual',
      })

      if (res.status === 303 || res.status === 307) {
        router.replace(nextUrl)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Credenciais inválidas')
      }

      const isJson = res.headers.get('content-type')?.includes('application/json')
      if (isJson) {
        const data = await res.json()
        router.replace(data?.redirectTo || nextUrl || '/home')
      } else {
        router.replace(nextUrl || '/home')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha no login'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`w-full max-w-md transition-all duration-700 ease-out ${
        formVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0'
      }`}
    >
      {/* Logo header */}
      <div
        className={`mb-8 flex flex-col items-center transition-all delay-100 duration-700 ${
          formVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#00823B] p-3 shadow-lg">
          <Image
            src="/neoenergia-icon-v2.ico"
            alt="Neoenergia"
            width={56}
            height={56}
            className="drop-shadow-md"
          />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Portal Capex</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse sua conta para continuar
        </p>
      </div>

      {/* Form card */}
      <div
        className={`rounded-xl border border-border bg-card p-8 shadow-xl transition-all delay-200 duration-700 ${
          formVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="usuario@neoenergia.com"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#00823B] focus:ring-[#00823B]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#00823B] focus:ring-[#00823B]"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="font-medium text-[#00823B] transition-colors hover:text-[#006830]"
              onClick={() => router.push('/register')}
              disabled={loading}
            >
              Criar conta
            </button>
            <button
              type="button"
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => router.push('/reset')}
              disabled={loading}
            >
              Esqueci minha senha
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full text-base font-semibold bg-[#00823B] text-white shadow-lg transition-all hover:bg-[#006830] hover:shadow-xl disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar no Portal'
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div
        className={`mt-6 text-center transition-all delay-300 duration-700 ${
          formVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <p className="text-xs text-muted-foreground">
          Neoenergia &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}

      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
        {/* Subtle background accents */}
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #00A443 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #0DA9FF 0%, transparent 70%)' }}
        />

        {splashDone && <LoginFormContent />}
      </main>

      <style jsx global>{`
        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </>
  )
}
