"use client"

import { useCallback, useEffect, useRef } from "react"
import type { TipoEvento } from "@/lib/data/eventos"

interface TrackPayload {
  tipo: TipoEvento
  id_producto?: number
  id_categoria?: number
  termino_busqueda?: string
  meta?: Record<string, unknown>
}

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let id = sessionStorage.getItem("track_session_id")
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem("track_session_id", id)
  }
  return id
}

export function useTrackEvent() {
  const sessionId = useRef<string>("")

  useEffect(() => {
    sessionId.current = getSessionId()
  }, [])

  const track = useCallback((payload: TrackPayload) => {
    fetch("/api/cliente/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, session_id: sessionId.current }),
    }).catch(() => {})
  }, [])

  return track
}
