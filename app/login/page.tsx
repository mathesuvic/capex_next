"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault() // Impede o recarregamento da página ao submeter o formulário
    
    // Por enquanto, vamos apenas mostrar os dados no console
    console.log("Tentativa de login com:")
    console.log("Email:", email)
    console.log("Senha:", password)

    // Lógica de validação simples
    if (email === "admin@neoenergia.com" && password === "admin123") {
      alert("Login bem-sucedido! Redirecionando...")
      // No futuro, aqui você redirecionaria o usuário para o dashboard
      // window.location.href = '/dashboard';
    } else {
      alert("Credenciais inválidas. Por favor, tente novamente.")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Ícone */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00823B]">
          <span className="text-2xl font-bold text-white">&lt;/&gt;</span>
        </div>

        {/* Títulos */}
        <h1 className="text-4xl font-bold text-slate-800">Neoenergia</h1>
        <p className="mt-2 text-md text-slate-500">
          Portal CAPEX - Aprovação de Projetos
        </p>
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
          <Button 
            type="submit" 
            className="w-full h-12 text-md font-semibold bg-[#00823B] hover:bg-[#00732E]"
          >
            Entrar no Portal
          </Button>
        </form>

        {/* Credenciais de Teste */}
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

