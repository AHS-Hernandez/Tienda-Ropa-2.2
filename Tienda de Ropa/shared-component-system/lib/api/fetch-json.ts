export async function fetchJson<T = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init)
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      res.status === 401
        ? "Sesión expirada. Vuelva a iniciar sesión."
        : `Respuesta vacía del servidor (${res.status}).`
    )
  }
  let data: T
  try {
    data = JSON.parse(text) as T
  } catch {
    throw new Error(
      `Respuesta no válida (${res.status}): ${text.slice(0, 120)}`
    )
  }
  if (!res.ok && data && typeof data === "object" && "message" in data) {
    throw new Error(String((data as { message: unknown }).message))
  }
  return data
}
