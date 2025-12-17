import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (email === "admin@neoenergia.com" && password === "admin123") {
    const res = NextResponse.json({ ok: true })
    res.cookies.set("auth", "admin", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    })
    return res
  }

  return NextResponse.json({ ok: false, message: "Credenciais inválidas" }, { status: 401 })
}
