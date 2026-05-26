"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Package, ShoppingCart, Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney, formatDate, ventaEstadoVariant } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"

const quickActions = [
  { label: "Catálogo", icon: Package, href: "/cliente/catalogo" },
  { label: "Carrito", icon: ShoppingCart, href: "/cliente/carrito" },
  { label: "Mis pedidos", icon: Clock, href: "/cliente/pedidos" },
]

export default function ClienteHomePage() {
  const [pedidos, setPedidos] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    fetch("/api/cliente/pedidos")
      .then((r) => r.json())
      .then((d) => d.ok && setPedidos((d.pedidos ?? []).slice(0, 5)))
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

      <Card className="border-brand-200 bg-brand-50/50 dark:bg-brand-950/20">
        <CardHeader>
          <CardTitle className="text-base">Cómo comprar (cliente)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Inicie sesión con su correo de cliente (ej. <strong>cliente@test.com</strong> / Abc123!).</p>
          <p>2. En <strong>Catálogo</strong>, pulse <strong>Agregar</strong> en productos con stock &gt; 0.</p>
          <p>3. En <strong>Carrito</strong>, revise líneas y pulse <strong>Procesar pago</strong> (sp_Procesar_Cobro_Venta).</p>
          <p>4. En <strong>Mis pedidos</strong> verá ventas completadas.</p>
        </CardContent>
      </Card>

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
