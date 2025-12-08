import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Apague aqui os cookies/tokens que você usa para autenticação
  cookies().delete("session")   // ajuste o nome do cookie
  cookies().delete("token")     // se usar outro

  return NextResponse.json({ ok: true })
}
