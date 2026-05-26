"use client"

import * as React from "react"
import { Package, FileQuestion, Search, AlertCircle, WifiOff, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Preset empty states
export function NoResultsState({
  query,
  onClear,
}: {
  query?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon={Search}
      title="Sin resultados"
      description={
        query
          ? `No encontramos resultados para "${query}". Intenta con otros términos.`
          : "No encontramos lo que buscas. Intenta con otros filtros."
      }
      action={onClear ? { label: "Limpiar búsqueda", onClick: onClear } : undefined}
    />
  )
}

export function NoDataState({ title = "Sin datos" }: { title?: string }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title={title}
      description="Aún no hay información disponible."
    />
  )
}

export function ErrorState({
  title = "Algo salió mal",
  description = "Hubo un error al cargar la información. Por favor intenta de nuevo.",
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? { label: "Reintentar", onClick: onRetry } : undefined}
    />
  )
}

export function OfflineState() {
  return (
    <EmptyState
      icon={WifiOff}
      title="Sin conexión"
      description="Parece que no tienes conexión a internet. Verifica tu conexión e intenta de nuevo."
    />
  )
}
