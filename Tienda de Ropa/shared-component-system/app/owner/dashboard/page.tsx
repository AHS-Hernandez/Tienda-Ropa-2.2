"use client"

import { useEffect, useState } from "react"
import { Building2, DollarSign, Package, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  SalesChartCard,
  CategoryChartCard,
  RecentOrdersWidget,
  ActivityFeedWidget,
} from "@/components/dashboard/charts"
import type { SalesChartPoint, CategoryChartPoint } from "@/components/dashboard/charts"

export default function OwnerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState<
    { label: string; value: string; hint: string }[]
  >([])
  const [chartData, setChartData] = useState<SalesChartPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryChartPoint[]>([])
  const [branches, setBranches] = useState<
    { name: string; estado: string; esCentral: boolean }[]
  >([])
  const [recentOrders, setRecentOrders] = useState<
    { id: string; customer: string; amount: number; time: string; status: string }[]
  >([])
  const [activities, setActivities] = useState<
    { id: number; type: string; action: string; description: string; user: string; time: string }[]
  >([])

  useEffect(() => {
    fetch("/api/owner/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setGlobalStats(d.globalStats ?? [])
          setChartData(d.chartData ?? [])
          setCategoryData(d.categoryData ?? [])
          setBranches(d.branches ?? [])
          setRecentOrders(d.recentOrders ?? [])
          setActivities(d.activities ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const icons = [DollarSign, DollarSign, Building2, Package]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Central</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de la sede Central. Para Central + sucursal en tiempo real use{" "}
            <strong>Red en vivo</strong>.
          </p>
        </div>
        <Badge variant="outline">Solo Central</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {globalStats.map((stat, i) => {
          const Icon = icons[i] ?? DollarSign
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>
                  </div>
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChartCard data={chartData} />
        </div>
        <CategoryChartCard data={categoryData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-brand-600" />
              Configuracion.vw_Estado_Red
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {branches.map((b) => (
              <div
                key={b.name}
                className="flex justify-between p-3 rounded-xl bg-muted/50"
              >
                <div>
                  <p className="font-medium">{b.name}</p>
                  {b.esCentral && (
                    <span className="text-xs text-brand-600">Central</span>
                  )}
                </div>
                <Badge variant={b.estado === "Online" ? "default" : "secondary"}>
                  {b.estado}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <RecentOrdersWidget
          orders={recentOrders.map((o) => ({
            id: o.id,
            customer: o.customer,
            amount: o.amount,
            time: o.time,
            status: o.status,
          }))}
        />
      </div>

      <ActivityFeedWidget activities={activities} />
    </div>
  )
}
