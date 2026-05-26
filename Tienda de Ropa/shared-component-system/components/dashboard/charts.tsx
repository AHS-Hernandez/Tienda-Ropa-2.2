"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp, TrendingDown, Package, AlertTriangle, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardCard, KPIWidget } from "@/components/cards/app-card"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"

const CHART_COLORS = ["#5FA37A", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4"]

export type SalesChartPoint = { name: string; ventas: number; pedidos: number }
export type CategoryChartPoint = { name: string; value: number; color?: string }
export type StockAlertRow = {
  id: string | number
  product: string
  currentStock: number
  minStock?: number
  severity: "critical" | "warning"
}
export type RecentOrderRow = {
  id: string
  customer: string
  amount: number
  time: string
  status: string
}
export type ActivityRow = {
  id: string | number
  type: string
  action: string
  description: string
  user: string
  time: string
}

interface SalesChartCardProps {
  className?: string
  data?: SalesChartPoint[]
}

export function SalesChartCard({ className, data = [] }: SalesChartCardProps) {
  const empty = data.length === 0
  return (
    <DashboardCard
      title="Ventas de la Semana"
      description="Ventas.vw_Ventas_Ultimos_7_Dias"
      className={className}
    >
      <div className="h-64">
        {empty ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sin ventas en los últimos 7 días
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5FA37A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5FA37A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs fill-muted-foreground"
                tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
                formatter={(value: number) => [formatMoney(value), "Ventas"]}
              />
              <Area type="monotone" dataKey="ventas" stroke="#5FA37A" strokeWidth={2} fill="url(#salesGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  )
}

interface OrdersChartCardProps {
  className?: string
  data?: SalesChartPoint[]
}

export function OrdersChartCard({ className, data = [] }: OrdersChartCardProps) {
  const empty = data.length === 0
  return (
    <DashboardCard title="Transacciones por Día" description="Ventas.vw_Ventas_Ultimos_7_Dias" className={className}>
      <div className="h-64">
        {empty ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <Tooltip />
              <Bar dataKey="pedidos" fill="#5FA37A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  )
}

interface CategoryChartCardProps {
  className?: string
  data?: CategoryChartPoint[]
}

export function CategoryChartCard({ className, data = [] }: CategoryChartCardProps) {
  const withColors = data.map((d, i) => ({
    ...d,
    color: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
  }))
  const total = withColors.reduce((s, c) => s + c.value, 0) || 1

  return (
    <DashboardCard title="Ventas por Categoría" description="Ventas.vw_Ventas_Por_Categoria_7Dias" className={className}>
      {withColors.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Sin ventas por categoría</p>
      ) : (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="mx-auto h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={withColors} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                  {withColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatMoney(value), "Total"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {withColors.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-sm">{category.name}</span>
                </div>
                <span className="text-sm font-medium">{Math.round((category.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardCard>
  )
}

export function RevenueWidget({
  totalRevenue,
  growth,
  className,
}: {
  totalRevenue: number
  growth: number
  className?: string
}) {
  const isPositive = growth >= 0
  return (
    <KPIWidget
      title="Ingresos (7 días)"
      value={formatMoney(totalRevenue)}
      trend={isPositive ? "up" : "down"}
      trendValue={`${isPositive ? "+" : ""}${growth.toFixed(1)}%`}
      subtitle="vs semana previa"
      icon={isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
      className={className}
    />
  )
}

export function LowStockAlertWidget({
  className,
  alerts = [],
}: {
  className?: string
  alerts?: StockAlertRow[]
}) {
  return (
    <DashboardCard
      title="Alertas de Stock"
      description={`Inventario.vw_Alertas_Stock_Bajo — ${alerts.length} productos`}
      className={className}
    >
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Stock en niveles normales</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {alerts.slice(0, 8).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-center justify-between rounded-xl p-3",
                alert.severity === "critical" ? "bg-red-50 dark:bg-red-950/20" : "bg-amber-50 dark:bg-amber-950/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    alert.severity === "critical"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  )}
                >
                  {alert.severity === "critical" ? (
                    <Package className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{alert.product}</p>
                  <p className="text-xs text-muted-foreground">Stock: {alert.currentStock}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}

export function RecentOrdersWidget({
  className,
  orders = [],
}: {
  className?: string
  orders?: RecentOrderRow[]
}) {
  return (
    <DashboardCard title="Ventas de Hoy" description="Ventas.vw_Ventas_Hoy_Global" className={className}>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Sin ventas hoy</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {orders.slice(0, 6).map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">{order.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatMoney(order.amount)}</p>
                <p className="text-xs text-emerald-600">{order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}

export function ActivityFeedWidget({
  className,
  activities = [],
}: {
  className?: string
  activities?: ActivityRow[]
}) {
  const icon = (type: string) => {
    if (type === "sale") return <ShoppingCart className="h-4 w-4" />
    if (type === "alert") return <AlertTriangle className="h-4 w-4" />
    return <Package className="h-4 w-4" />
  }

  return (
    <DashboardCard title="Bitácora reciente" description="Seguridad.vw_Trazabilidad_Bitacora" className={className}>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Sin actividad reciente</p>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                {icon(activity.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="truncate text-xs text-muted-foreground">{activity.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.user} · {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  )
}
