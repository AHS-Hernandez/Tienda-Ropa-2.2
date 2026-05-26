import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { SessionUser } from "@/lib/auth/types"

export const SESSION_COOKIE = "sc_session"
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 horas

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET debe definirse en .env.local (mínimo 16 caracteres)."
    )
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export function getSessionFromCookieValue(
  cookieValue: string | undefined
): Promise<SessionUser | null> {
  if (!cookieValue) return Promise.resolve(null)
  return verifySessionToken(cookieValue)
}
