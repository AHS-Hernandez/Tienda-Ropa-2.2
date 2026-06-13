"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Package, ShoppingCart, Clock, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney, formatDate, ventaEstadoVariant } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import type { RecomendacionFeed } from "@/lib/data/feed"

const quickActions = [
  { label: "Catálogo", icon: Package, href: "/cliente/catalogo" },
  { label: "Carrito", icon: ShoppingCart, href: "/cliente/carrito" },
  { label: "Mis pedidos", icon: Clock, href: "/cliente/pedidos" },
]

const MOTIVO_COLOR: Record<string, string> = {
  vistos_no_comprados: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  categoria_afin:      "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  co_visitacion:       "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  trending_sede:       "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

function FeedCard({ rec }: { rec: RecomendacionFeed }) {
  const precio = rec.precio_final ?? rec.precio_venta
  const tieneDescuento = rec.precio_final !== null && rec.precio_final < rec.precio_venta
  const colorClass = MOTIVO_COLOR[rec.motivo] ?? "bg-muted text-muted-foreground"

  return (
    <Link href={`/cliente/catalogo/${rec.id_producto}`}>
      <div className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
        <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground/30 transition-transform group-hover:scale-110" />
        </div>
        <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">{rec.nombre}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">
            {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(precio)}
          </p>
          {tieneDescuento && (
            <p className="text-[10px] text-muted-foreground line-through">
              {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(rec.precio_venta)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className={`h-3 w-3 ${s <= Math.round(rec.score * 5) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
          ))}
        </div>
        <span className={`self-start rounded-full px-2 py-0.5 text-[10px] font-medium ${colorClass}`}>
          {rec.motivo_label}
        </span>
      </div>
    </Link>
  )
}

export default function ClienteHomePage() {
  const [pedidos, setPedidos] = useState<Record<string, unknown>[]>([])
  const [feed, setFeed] = useState<RecomendacionFeed[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  useEffect(() => {
    fetch("/api/cliente/pedidos")
      .then((r) => r.json())
      .then((d) => d.ok && setPedidos((d.pedidos ?? []).slice(0, 5)))
  }, [])

  useEffect(() => {
    fetch("/api/cliente/feed")
      .then((r) => r.json())
      .then((d) => d.ok && setFeed(d.recomendaciones ?? []))
      .finally(() => setLoadingFeed(false))
  }, [])

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-8 text-white"
      >
        <h1 className="text-2xl font-bold">Panel de cliente</h1>
        <p className="mt-2 text-white/80 text-sm">
          Catálogo, carrito y pedidos conectados a SQL Server
        </p>
        <Link href="/cliente/catalogo">
          <Button variant="secondary" className="mt-4 bg-white text-brand-700 hover:bg-white/90">
            Explorar catálogo
          </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="hover:border-primary/40 transition-colors h-full">
              <CardContent className="flex items-center gap-3 pt-6">
                <a.icon className="h-8 w-8 text-brand-600" />
                <span className="font-medium">{a.label}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Feed personalizado */}
      {(loadingFeed || feed.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recomendado para ti</h2>
          {loadingFeed ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3 animate-pulse">
                  <div className="aspect-[3/4] rounded-lg bg-muted mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {feed.slice(0, 8).map((rec) => (
                <FeedCard key={rec.id_producto} rec={rec} />
              ))}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos recientes</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {pedidos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Sin pedidos aún</p>
          ) : (
            pedidos.map((p) => (
              <div key={String(p.id_venta)} className="flex justify-between items-center py-3 text-sm">
                <div>
                  <p className="font-medium">{String(p.Nro_factura ?? `Venta #${p.id_venta}`)}</p>
                  <p className="text-muted-foreground">{formatDate(String(p.Fecha_emision))}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <StatusBadge variant={ventaEstadoVariant(String(p.Estado))} dot>
                    {String(p.Estado)}
                  </StatusBadge>
                  <span className="font-semibold">{formatMoney(Number(p.Total_neto))}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
