"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag, ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductResenas } from "@/components/erp/product-resenas"
import { useTrackEvent } from "@/hooks/use-track-event"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

function formatPrecio(n: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n)
}

export default function ClienteProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const track = useTrackEvent()

  const [producto, setProducto] = useState<ProductoCatalogoRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [adding, setAdding] = useState(false)
  const [cartMsg, setCartMsg] = useState<string | null>(null)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    fetch(`/api/cliente/catalogo/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.message)
        setProducto(d.producto)
        track({ tipo: "vista_producto", id_producto: Number(id) })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, track])

  const addToCart = async () => {
    if (!producto) return
    setAdding(true)
    try {
      const res = await fetch("/api/cliente/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", id_producto: producto.id_producto, cantidad }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setCartMsg("Agregado al carrito")
      setTimeout(() => setCartMsg(null), 3000)
      track({ tipo: "agregar_carrito", id_producto: producto.id_producto })
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo agregar")
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
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
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Imagen */}
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

        {/* Info */}
        <div className="space-y-5">
          {producto.marca && (
            <p className="text-sm font-medium text-primary">{producto.marca}</p>
          )}
          <h1 className="text-2xl font-bold text-foreground">{producto.nombre}</h1>
          <p className="text-sm text-muted-foreground">{producto.categoria} · {producto.subcategoria}</p>

          {/* Precio */}
          <div>
            <p className="text-3xl font-bold text-foreground">{formatPrecio(precioFinal)}</p>
            {tieneDescuento && (
              <p className="mt-0.5 text-sm text-muted-foreground line-through">{formatPrecio(producto.precio_venta)}</p>
            )}
            {producto.promocion && (
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {producto.promocion}
              </span>
            )}
          </div>

          {/* Atributos */}
          <div className="flex flex-wrap gap-2">
            {producto.color && (
              <span className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm">
                Color: <strong>{producto.color}</strong>
              </span>
            )}
            {producto.talla && (
              <span className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm">
                Talla: <strong>{producto.talla}</strong>
              </span>
            )}
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <p className="text-sm text-muted-foreground leading-relaxed">{producto.descripcion}</p>
          )}

          {/* Cantidad + Agregar */}
          {producto.stock > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="w-9 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium">{cantidad}</span>
                <button
                  onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
                  className="w-9 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  +
                </button>
              </div>
              <Button onClick={addToCart} disabled={adding} className="flex-1 gap-2">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                {adding ? "Agregando…" : "Agregar al carrito"}
              </Button>
            </div>
          )}

          {cartMsg && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              {cartMsg}
            </p>
          )}
        </div>
      </div>

      {/* Reseñas */}
      <ProductResenas idProducto={producto.id_producto} nombreProducto={producto.nombre} />
    </div>
  )
}
