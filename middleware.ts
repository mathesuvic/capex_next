import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rotas liberadas
  const publicPaths = ["/login", "/favicon.ico"]
  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public")

  if (isPublic) return NextResponse.next()

  const auth = req.cookies.get("auth")?.value
  if (!auth) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|static|.*\\..*).*)"],
}
