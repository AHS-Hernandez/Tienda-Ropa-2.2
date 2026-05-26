"use client"

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, TrendingUp, Users, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SalesChartCard, OrdersChartCard } from "@/components/dashboard/charts"
import type { SalesChartPoint } from "@/components/dashboard/charts"
import { formatMoney } from "@/lib/format"

export default function AdminSedeDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ label: string; value: string; sub: string }[]>([])
  const [chartData, setChartData] = useState<SalesChartPoint[]>([])
  const [recentSales, setRecentSales] = useState<
    { id: string; customer: string; amount: number; time: string; estado: string }[]
  >([])
  const [lowStock, setLowStock] = useState<
    { name: string; stock: number; nivel: string; key: number }[]
  >([])

  useEffect(() => {
    fetch("/api/admin-sede/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setStats(d.stats ?? [])
          setChartData(d.chartData ?? [])
          setRecentSales(d.recentSales ?? [])
          setLowStock(d.lowStock ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const icons = [DollarSign, ShoppingCart, TrendingUp, Users]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard — Sede</h1>
          <p className="text-muted-foreground text-sm">
            Ventas.vw_Resumen_Ventas_Hoy_Sede · vw_Ventas_Ultimos_7_Dias
          </p>
        </div>
        <Badge variant="outline" className="text-brand-600 border-brand-600">
          Datos en vivo
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = icons[i] ?? DollarSign
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChartCard data={chartData} />
        <OrdersChartCard data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas recientes hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ventas hoy</p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{sale.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.time} · {sale.estado}
                    </p>
                  </div>
                  <p className="font-bold text-brand-600">{formatMoney(sale.amount)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-base">Inventario.vw_Alertas_Stock_Bajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Stock normal</p>
            ) : (
              lowStock.map((item) => (
                <div key={item.key} className="flex justify-between p-3 rounded-xl bg-background border">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.nivel}</p>
                  </div>
                  <span className="font-mono font-bold text-amber-600">{item.stock}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
