"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
}

export function AppCard({
  className,
  children,
  hover = true,
  glass = false,
  ...props
}: AppCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm",
        hover && "transition-all duration-200 hover:shadow-md hover:border-primary/20",
        glass && "glass",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs mes anterior",
  icon,
  className,
}: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <AppCard className={className}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change !== undefined && (
            <p className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  "font-medium",
                  isPositive && "text-emerald-600 dark:text-emerald-400",
                  isNegative && "text-red-600 dark:text-red-400"
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              <span className="text-muted-foreground">{changeLabel}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </AppCard>
  )
}

interface KPIWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

export function KPIWidget({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  className,
}: KPIWidgetProps) {
  return (
    <AppCard className={cn("relative overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {(subtitle || trendValue) && (
            <div className="mt-1 flex items-center gap-2">
              {trendValue && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-emerald-600",
                    trend === "down" && "text-red-600",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </AppCard>
  )
}

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
}

export function DashboardCard({
  title,
  description,
  action,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <AppCard className={cn("flex flex-col", className)} {...props}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </AppCard>
  )
}
