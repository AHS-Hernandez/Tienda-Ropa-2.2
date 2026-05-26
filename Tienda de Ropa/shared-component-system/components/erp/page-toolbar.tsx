"use client"

import { SearchInput } from "@/components/forms/search-input"
import { cn } from "@/lib/utils"

interface PageToolbarProps {
  search?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  /** Texto de ayuda bajo el campo de búsqueda */
  searchHint?: string
  children?: React.ReactNode
  className?: string
}

export function PageToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  searchHint,
  children,
  className,
}: PageToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {onSearchChange && (
        <div className="space-y-1 max-w-md w-full">
          <SearchInput
            value={search ?? ""}
            onSearch={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full"
          />
          {searchHint && (
            <p className="text-xs text-muted-foreground">{searchHint}</p>
          )}
        </div>
      )}
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
