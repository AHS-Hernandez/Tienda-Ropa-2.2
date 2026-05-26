"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        info: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
        neutral: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        primary: "bg-primary/10 text-primary dark:bg-primary/20",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean
}

export function StatusBadge({
  className,
  variant,
  dot = false,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "error" && "bg-red-500",
            variant === "info" && "bg-sky-500",
            variant === "neutral" && "bg-slate-500",
            variant === "primary" && "bg-primary"
          )}
        />
      )}
      {children}
    </span>
  )
}

// Convenience components for common status types
export function SuccessBadge({ children, ...props }: Omit<StatusBadgeProps, "variant">) {
  return (
    <StatusBadge variant="success" {...props}>
      {children}
    </StatusBadge>
  )
}

export function WarningBadge({ children, ...props }: Omit<StatusBadgeProps, "variant">) {
  return (
    <StatusBadge variant="warning" {...props}>
      {children}
    </StatusBadge>
  )
}

export function ErrorBadge({ children, ...props }: Omit<StatusBadgeProps, "variant">) {
  return (
    <StatusBadge variant="error" {...props}>
      {children}
    </StatusBadge>
  )
}

export function InfoBadge({ children, ...props }: Omit<StatusBadgeProps, "variant">) {
  return (
    <StatusBadge variant="info" {...props}>
      {children}
    </StatusBadge>
  )
}

// Order status mapping
export function OrderStatusBadge({ status }: { status: "pending" | "processing" | "completed" | "cancelled" }) {
  const statusConfig = {
    pending: { variant: "warning" as const, label: "Pendiente" },
    processing: { variant: "info" as const, label: "Procesando" },
    completed: { variant: "success" as const, label: "Completado" },
    cancelled: { variant: "error" as const, label: "Cancelado" },
  }

  const config = statusConfig[status]
  return (
    <StatusBadge variant={config.variant} dot>
      {config.label}
    </StatusBadge>
  )
}

// Stock status mapping
export function StockStatusBadge({ status }: { status: "in-stock" | "low-stock" | "out-of-stock" }) {
  const statusConfig = {
    "in-stock": { variant: "success" as const, label: "En Stock" },
    "low-stock": { variant: "warning" as const, label: "Stock Bajo" },
    "out-of-stock": { variant: "error" as const, label: "Agotado" },
  }

  const config = statusConfig[status]
  return (
    <StatusBadge variant={config.variant} dot>
      {config.label}
    </StatusBadge>
  )
}

// User status mapping
export function UserStatusBadge({ status }: { status: "active" | "inactive" }) {
  const statusConfig = {
    active: { variant: "success" as const, label: "Activo" },
    inactive: { variant: "neutral" as const, label: "Inactivo" },
  }

  const config = statusConfig[status]
  return (
    <StatusBadge variant={config.variant} dot>
      {config.label}
    </StatusBadge>
  )
}
