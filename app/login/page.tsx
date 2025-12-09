"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error("Credenciais inválidas")

      // Cookie 'auth' é setado no servidor. Agora podemos seguir para o app.
      router.push("/home")
    } catch (err: any) {
      setError(err.message || "Falha no login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00823B]">
          <span className="text-2xl font-bold text-white">&lt;/&gt;</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-800">Neoenergia</h1>
        <p className="mt-2 text-md text-slate-500">Portal CAPEX - Aprovação de Projetos</p>
      </div>

      <div className="mt-8 w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="email" className="font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@neoenergia.com"
              required
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full h-12 text-md font-semibold bg-[#00823B] hover:bg-[#00732E]">
            {loading ? "Entrando..." : "Entrar no Portal"}
          </Button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="text-center text-xs text-slate-500">
            <p className="font-bold mb-1">Credenciais de teste:</p>
            <p>Email: admin@neoenergia.com</p>
            <p>Senha: admin123</p>
          </div>
        </div>
      </div>
    </main>
  )
}
