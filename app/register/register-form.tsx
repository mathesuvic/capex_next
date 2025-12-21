// app/register/register-form.tsx
"use client";

import { useState } from "react";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error ?? "Erro ao cadastrar");
        return;
      }

      setMsg("Cadastro realizado com sucesso! Redirecionando...");
      // Se sua home for /home, use "/home"
      window.location.href = "/home";
    } catch {
      setMsg("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    loading || name.trim().length < 2 || !email.includes("@") || password.length < 6;

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-4">
      <label className="grid gap-1">
        <span className="text-sm text-muted-foreground">Nome</span>
        <input
          className="border rounded-md px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-muted-foreground">Email</span>
        <input
          className="border rounded-md px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-muted-foreground">Senha</span>
        <input
          className="border rounded-md px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-primary text-white px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Cadastrando..." : "Cadastrar"}
      </button>

      {msg && (
        <p className={`text-sm ${msg.includes("sucesso") ? "text-green-700" : "text-red-600"}`}>
          {msg}
        </p>
      )}
    </form>
  );
}
