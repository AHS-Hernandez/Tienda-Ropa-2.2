"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

function formatPrecio(n: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n)
}

interface Resena {
  _id: string
  id_cliente: number
  rating: number
  titulo: string
  texto: string
  fecha: string
  nombre_cliente?: string
}

interface Resumen {
  promedio: number
  total: number
  distribucion: Record<string, number>
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  )
}

export default function VendedorProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [imgFailed, setImgFailed] = useState(false)
  const [producto, setProducto] = useState<ProductoCatalogoRow | null>(null)
  const [resenas, setResenas] = useState<Resena[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loadingProducto, setLoadingProducto] = useState(true)
  const [loadingResenas, setLoadingResenas] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/vendedor/catalogo/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.message)
        setProducto(d.producto)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingProducto(false))

    fetch(`/api/vendedor/resenas?id_producto=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setResenas(d.resenas)
          setResumen(d.resumen)
        }
      })
      .finally(() => setLoadingResenas(false))
  }, [id])

  if (loadingProducto) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
  const fotoUrl = producto.fotos?.[0] ?? null

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-muted">
          {fotoUrl && !imgFailed ? (
            <img
              src={fotoUrl}
              alt={producto.nombre}
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <ShoppingBag className="h-20 w-20 text-muted-foreground/20" />
          )}
        </div>

        <div className="space-y-4">
          {producto.marca && (
            <p className="text-sm font-medium text-primary">{producto.marca}</p>
          )}
          <h1 className="text-2xl font-bold">{producto.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {producto.categoria} · {producto.subcategoria}
          </p>

          <div>
            <p className="text-2xl font-bold">{formatPrecio(precioFinal)}</p>
            {tieneDescuento && (
              <p className="text-sm text-muted-foreground line-through">
                {formatPrecio(producto.precio_venta)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {producto.color && (
              <span className="rounded-lg border border-border px-3 py-1.5">
                Color: <strong>{producto.color}</strong>
              </span>
            )}
            {producto.talla && (
              <span className="rounded-lg border border-border px-3 py-1.5">
                Talla: <strong>{producto.talla}</strong>
              </span>
            )}
            <span
              className={`rounded-lg px-3 py-1.5 font-medium ${
                producto.stock === 0
                  ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                  : producto.stock <= 5
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              }`}
            >
              Stock: {producto.stock}
            </span>
          </div>

          {producto.descripcion && (
            <p className="text-sm text-muted-foreground">{producto.descripcion}</p>
          )}

          {resumen && resumen.total > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <StarRow rating={Math.round(resumen.promedio)} size="lg" />
              <span className="text-lg font-bold">{resumen.promedio.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({resumen.total} reseñas)</span>
            </div>
          )}
        </div>
      </div>

      {/* Reseñas publicadas (solo lectura) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Reseñas de clientes</h2>

        {loadingResenas ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : resenas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este producto aún no tiene reseñas.</p>
        ) : (
          <div className="space-y-3">
            {resenas.map((r) => (
              <div key={r._id} className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <StarRow rating={r.rating} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.fecha).toLocaleDateString("es-BO")}
                  </span>
                </div>
                <p className="text-sm font-semibold">{r.titulo}</p>
                <p className="text-sm text-muted-foreground">{r.texto}</p>
                <p className="text-xs text-muted-foreground">— {r.nombre_cliente ?? `Cliente #${r.id_cliente}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
