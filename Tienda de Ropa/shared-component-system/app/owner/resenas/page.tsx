"use client"

import { useCallback, useEffect, useState } from "react"
import { Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Resena {
  _id: string
  id_producto: number
  id_cliente: number
  id_venta: number
  rating: number
  titulo: string
  texto: string
  estado: "publicada" | "oculta"
  fecha: string
  nombre_cliente?: string
  nombre_producto?: string | null
  respuestas?: Respuesta[]
}

interface Respuesta {
  _id: string
  autor: string
  autor_rol: "cliente" | "vendedor" | "admin-sede" | "admin-global"
  texto: string
  fecha: string
  estado: "publicada" | "oculta"
  editada?: boolean
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  )
}

export default function OwnerResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<"" | "publicada" | "oculta">("")
  const [idProductoFiltro, setIdProductoFiltro] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingRespuestaId, setTogglingRespuestaId] = useState<string | null>(null)
  const [deletingRespuestaId, setDeletingRespuestaId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set("estado", filtroEstado)
      if (idProductoFiltro.trim()) params.set("id_producto", idProductoFiltro.trim())
      const res = await fetch(`/api/owner/resenas?${params}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenas(data.resenas)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar reseñas")
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, idProductoFiltro])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const toggleEstado = async (r: Resena) => {
    const nuevoEstado = r.estado === "publicada" ? "oculta" : "publicada"
    setTogglingId(r._id)
    try {
      const res = await fetch("/api/owner/resenas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: r._id, estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenas((prev) =>
        prev.map((x) => (x._id === r._id ? { ...x, estado: nuevoEstado } : x))
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  const eliminar = async (r: Resena) => {
    if (!confirm(`¿Eliminar permanentemente la reseña "${r.titulo}"?`)) return
    setDeletingId(r._id)
    try {
      const res = await fetch("/api/owner/resenas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: r._id }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenas((prev) => prev.filter((x) => x._id !== r._id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    } finally {
      setDeletingId(null)
    }
  }

  const toggleRespuestaEstado = async (resena: Resena, respuesta: Respuesta) => {
    const nuevoEstado = respuesta.estado === "publicada" ? "oculta" : "publicada"
    setTogglingRespuestaId(respuesta._id)
    try {
      const res = await fetch(`/api/cliente/resenas/${resena._id}/respuestas/${respuesta._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenas((prev) =>
        prev.map((x) =>
          x._id === resena._id
            ? {
                ...x,
                respuestas: (x.respuestas ?? []).map((y) =>
                  y._id === respuesta._id ? { ...y, estado: nuevoEstado } : y
                ),
              }
            : x
        )
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cambiar estado de la respuesta")
    } finally {
      setTogglingRespuestaId(null)
    }
  }

  const eliminarRespuesta = async (resena: Resena, respuesta: Respuesta) => {
    if (!confirm(`¿Eliminar permanentemente la respuesta de ${respuesta.autor}?`)) return
    setDeletingRespuestaId(respuesta._id)
    try {
      const res = await fetch(`/api/cliente/resenas/${resena._id}/respuestas/${respuesta._id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenas((prev) =>
        prev.map((x) =>
          x._id === resena._id
            ? { ...x, respuestas: (x.respuestas ?? []).filter((y) => y._id !== respuesta._id) }
            : x
        )
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar la respuesta")
    } finally {
      setDeletingRespuestaId(null)
    }
  }

  const publicadas = resenas.filter((r) => r.estado === "publicada").length
  const ocultas = resenas.filter((r) => r.estado === "oculta").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Reseñas</h1>
        <p className="text-sm text-muted-foreground">
          Todas las reseñas y respuestas de la red — puedes ocultar, publicar o eliminar permanentemente
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={idProductoFiltro}
          onChange={(e) => setIdProductoFiltro(e.target.value)}
          placeholder="ID de producto…"
          type="number"
          className="w-40 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex gap-2">
          {(["", "publicada", "oculta"] as const).map((e) => (
            <Button
              key={e}
              size="sm"
              variant={filtroEstado === e ? "default" : "outline"}
              onClick={() => setFiltroEstado(e)}
            >
              {e === "" ? "Todas" : e === "publicada" ? "Publicadas" : "Ocultas"}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {publicadas} publicadas · {ocultas} ocultas
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : resenas.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Sin reseñas</p>
      ) : (
        <div className="space-y-3">
          {resenas.map((r) => (
            <div
              key={r._id}
              className={`rounded-xl border p-4 space-y-2 transition-opacity ${
                r.estado === "oculta" ? "opacity-50 border-border" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRow rating={r.rating} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.estado === "publicada"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.estado}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {r.nombre_producto ?? `Producto #${r.id_producto}`}
                    </span>
                  </div>
                  <p className="text-sm font-semibold">{r.titulo}</p>
                  <p className="text-sm text-muted-foreground">{r.texto}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.nombre_cliente ?? `Cliente #${r.id_cliente}`} · Venta #{r.id_venta} ·{" "}
                    {new Date(r.fecha).toLocaleDateString("es-BO")}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleEstado(r)}
                    disabled={togglingId === r._id || deletingId === r._id}
                    className="gap-1.5"
                  >
                    {togglingId === r._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : r.estado === "publicada" ? (
                      <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>
                    ) : (
                      <><Eye className="h-3.5 w-3.5" /> Publicar</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => eliminar(r)}
                    disabled={deletingId === r._id || togglingId === r._id}
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {deletingId === r._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {r.respuestas && r.respuestas.length > 0 && (
                <div className="ml-3 space-y-2 border-l border-border pl-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Respuestas ({r.respuestas.length})
                  </p>
                  {r.respuestas.map((respuesta) => (
                    <div
                      key={respuesta._id}
                      className={`rounded-lg border p-3 transition-opacity ${
                        respuesta.estado === "oculta"
                          ? "opacity-50 border-border"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                respuesta.estado === "publicada"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {respuesta.estado}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {respuesta.autor_rol}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{respuesta.autor}</p>
                          <p className="text-sm text-muted-foreground">{respuesta.texto}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(respuesta.fecha).toLocaleDateString("es-BO")}
                            {respuesta.editada ? " · editada" : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleRespuestaEstado(r, respuesta)}
                            disabled={togglingRespuestaId === respuesta._id || deletingRespuestaId === respuesta._id}
                            className="gap-1.5"
                          >
                            {togglingRespuestaId === respuesta._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : respuesta.estado === "publicada" ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" /> Ocultar
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" /> Publicar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarRespuesta(r, respuesta)}
                            disabled={deletingRespuestaId === respuesta._id || togglingRespuestaId === respuesta._id}
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            {deletingRespuestaId === respuesta._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
