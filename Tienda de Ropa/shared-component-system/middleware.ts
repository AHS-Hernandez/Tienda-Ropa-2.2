import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ROLE_HOME_PATH, roleFromPath } from "@/lib/auth/constants"
import { SESSION_COOKIE, getSessionFromCookieValue } from "@/lib/auth/session"
import type { UserRole } from "@/lib/navigation"

const PUBLIC_PREFIXES = [
  "/auth/demo",
  "/auth/register",
  "/auth/register-success",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
]

function isPublicAuthPath(pathname: string): boolean {
  if (pathname === "/auth/login") return true
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function requiredRoleForPath(pathname: string): UserRole | null {
  return roleFromPath(pathname)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (pathname === "/auth/login") {
    const wantsLogout =
      request.nextUrl.searchParams.get("logout") === "1" ||
      request.nextUrl.searchParams.get("salir") === "1"

    if (wantsLogout) {
      const url = new URL("/auth/login", request.url)
      const res = NextResponse.redirect(url)
      res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
      return res
    }

    const session = await getSessionFromCookieValue(token)
    if (session) {
      return NextResponse.redirect(
        new URL(ROLE_HOME_PATH[session.role], request.url)
      )
    }
    return NextResponse.next()
  }

  const session = await getSessionFromCookieValue(token)

  if (isPublicAuthPath(pathname)) {
    if (pathname.startsWith("/auth/register") && session) {
      return NextResponse.redirect(
        new URL(ROLE_HOME_PATH[session.role], request.url)
      )
    }
    return NextResponse.next()
  }

  const requiredRole = requiredRoleForPath(pathname)

  if (requiredRole) {
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (session.role !== requiredRole) {
      return NextResponse.redirect(
        new URL(ROLE_HOME_PATH[session.role], request.url)
      )
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/cliente/:path*",
    "/vendedor/:path*",
    "/admin-sede/:path*",
    "/owner/:path*",
    "/auth/login",
    "/auth/register",
    "/auth/register-success",
  ],
}
