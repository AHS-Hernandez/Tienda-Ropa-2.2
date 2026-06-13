"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

interface ProductCardProps {
  producto: ProductoCatalogoRow
  href: string
  onAgregar?: (idProducto: number) => void
  hideStock?: boolean
  className?: string
}

function formatPrecio(n: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n)
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-950 dark:text-red-400">Agotado</span>
  if (stock <= 5)
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-950 dark:text-amber-400">Pocas unidades</span>
  return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">Disponible</span>
}

export function ProductCard({ producto, href, onAgregar, hideStock = false, className }: ProductCardProps) {
  const router = useRouter()
  const [imgFailed, setImgFailed] = useState(false)
  const precioFinal = producto.precio_final ?? producto.precio_venta
  const tieneDescuento = producto.precio_final !== null && producto.precio_final < producto.precio_venta
  const fotoUrl = producto.fotos?.[0] ?? null

  return (
    <div
      onClick={() => router.push(href)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/30",
        className
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
        {fotoUrl && !imgFailed ? (
          <img
            src={fotoUrl}
            alt={producto.nombre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ShoppingBag className="h-12 w-12 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />
        )}
        {tieneDescuento && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            OFERTA
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{producto.subcategoria}</span>
          {producto.marca && <span className="font-medium text-primary">{producto.marca}</span>}
        </div>

        <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {producto.nombre}
        </p>

        {(producto.color || producto.talla) && (
          <p className="text-[10px] text-muted-foreground">
            {[producto.color, producto.talla].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            <p className="text-base font-bold text-foreground">{formatPrecio(precioFinal)}</p>
            {tieneDescuento && (
              <p className="text-xs text-muted-foreground line-through">{formatPrecio(producto.precio_venta)}</p>
            )}
          </div>
          {!hideStock && <StockBadge stock={producto.stock} />}
        </div>
      </div>

      {/* Botón agregar — visible en hover si hay stock y callback */}
      {onAgregar && producto.stock > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onAgregar(producto.id_producto) }}
          className="absolute inset-x-3 bottom-3 translate-y-2 rounded-xl bg-primary py-1.5 text-xs font-semibold text-primary-foreground opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        >
          Agregar
        </button>
      )}
    </div>
  )
}
