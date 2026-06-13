"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductFoto } from "@/components/erp/product-foto"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

function formatPrecio(n: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n)
}

interface Resena {
  _id: string
  id_cliente: number
  id_venta: number
  rating: number
  titulo: string
  texto: string
  estado: "publicada" | "oculta"
  fecha: string
  nombre_cliente?: string
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
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  )
}

export default function AdminSedeCatalogoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [producto, setProducto] = useState<ProductoCatalogoRow | null>(null)
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loadingProducto, setLoadingProducto] = useState(true)
  const [loadingResenas, setLoadingResenas] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingRespuestaId, setTogglingRespuestaId] = useState<string | null>(null)
  const [deletingRespuestaId, setDeletingRespuestaId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin-sede/catalogo/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.message)
        setProducto(d.producto)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProducto(false))

    fetch(`/api/admin-sede/resenas?id_producto=${id}`)
      .then((r) => r.json())
      .then((d) => d.ok && setResenas(d.resenas))
      .finally(() => setLoadingResenas(false))
  }, [id])

  const toggleEstado = async (resena: Resena) => {
    const nuevoEstado = resena.estado === "publicada" ? "oculta" : "publicada"
    setTogglingId(resena._id)
    try {
      const res = await fetch("/api/admin-sede/resenas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: resena._id, estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenas((prev) =>
        prev.map((r) => (r._id === resena._id ? { ...r, estado: nuevoEstado } : r))
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  const eliminarResena = async (resena: Resena) => {
    if (!confirm(`¿Eliminar permanentemente esta reseña de "${resena.titulo}"?`)) return
    setDeletingId(resena._id)
    try {
      const res = await fetch("/api/admin-sede/resenas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: resena._id }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenas((prev) => prev.filter((r) => r._id !== resena._id))
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
        prev.map((r) =>
          r._id === resena._id
            ? {
                ...r,
                respuestas: (r.respuestas ?? []).map((x) =>
                  x._id === respuesta._id ? { ...x, estado: nuevoEstado } : x
                ),
              }
            : r
        )
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cambiar estado")
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
        prev.map((r) =>
          r._id === resena._id
            ? { ...r, respuestas: (r.respuestas ?? []).filter((x) => x._id !== respuesta._id) }
            : r
        )
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar la respuesta")
    } finally {
      setDeletingRespuestaId(null)
    }
  }

  if (loadingProducto) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (error || !producto) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{error ?? "Producto no encontrado"}</p>
        <Button variant="outline" onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  const precioFinal = producto.precio_final ?? producto.precio_venta
  const tieneDescuento = producto.precio_final !== null && producto.precio_final < producto.precio_venta

  return (
    <div className="space-y-8">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </button>

      {/* Detalle del producto */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductFoto
          idProducto={producto.id_producto}
          initialFotos={producto.fotos ?? []}
          canEdit
        />

        <div className="space-y-4">
          {producto.marca && <p className="text-sm font-medium text-primary">{producto.marca}</p>}
          <h1 className="text-2xl font-bold">{producto.nombre}</h1>
          <p className="text-sm text-muted-foreground">{producto.categoria} · {producto.subcategoria}</p>

          <div>
            <p className="text-2xl font-bold">{formatPrecio(precioFinal)}</p>
            {tieneDescuento && (
              <p className="text-sm text-muted-foreground line-through">{formatPrecio(producto.precio_venta)}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {producto.color && (
              <span className="rounded-lg border border-border px-3 py-1.5">Color: <strong>{producto.color}</strong></span>
            )}
            {producto.talla && (
              <span className="rounded-lg border border-border px-3 py-1.5">Talla: <strong>{producto.talla}</strong></span>
            )}
            <span className={`rounded-lg px-3 py-1.5 font-medium ${
              producto.stock === 0
                ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            }`}>
              Stock: {producto.stock}
            </span>
          </div>

          {producto.descripcion && (
            <p className="text-sm text-muted-foreground">{producto.descripcion}</p>
          )}
        </div>
      </div>

      {/* Gestión de reseñas */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Reseñas</h2>
          <p className="text-sm text-muted-foreground">
            {resenas.length} reseña{resenas.length !== 1 ? "s" : ""} en total
          </p>
        </div>

        {loadingResenas ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : resenas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin reseñas aún.</p>
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StarRow rating={r.rating} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.estado === "publicada"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {r.estado}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{r.titulo}</p>
                    <p className="text-sm text-muted-foreground">{r.texto}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.nombre_cliente ?? `Cliente #${r.id_cliente}`} · Venta #{r.id_venta} · {new Date(r.fecha).toLocaleDateString("es-BO")}
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
                      onClick={() => eliminarResena(r)}
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
    </div>
  )
}
