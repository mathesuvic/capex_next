"use client"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()
  const doLogout = async () => {
    await fetch("/api/logout", { method: "POST" })
    router.push("/login")
  }
  return (
    <button onClick={doLogout} className="text-xs text-slate-600 underline">
      Sair
    </button>
  )
}