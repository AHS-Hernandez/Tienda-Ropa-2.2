"use client"

import * as React from "react"
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/loading-skeleton"

// Table Types
export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface TableAction<T> {
  label: string
  onClick: (item: T) => void
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  separator?: boolean
}

interface ModernTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: TableAction<T>[]
  loading?: boolean
  emptyState?: React.ReactNode
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  onSort?: (column: string) => void
  keyExtractor: (item: T) => string
  className?: string
}

export function ModernTable<T>({
  data,
  columns,
  actions,
  loading,
  emptyState,
  sortColumn,
  sortDirection,
  onSort,
  keyExtractor,
  className,
}: ModernTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
              {actions && <th className="w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-4">
                    <Skeleton className="h-4 w-full max-w-[150px]" />
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-4">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-8", className)}>
        {emptyState}
      </div>
    )
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                    col.className
                  )}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort?.(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.header}
                      <ArrowUpDown
                        className={cn(
                          "h-4 w-4",
                          sortColumn === col.key && "text-primary"
                        )}
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {actions && <th className="w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-muted/30 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-4 text-sm", col.className)}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, index) => (
                          <React.Fragment key={action.label}>
                            {action.separator && index > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              onClick={() => action.onClick(item)}
                              className={cn(
                                action.variant === "destructive" &&
                                  "text-destructive focus:text-destructive"
                              )}
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          </React.Fragment>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Pagination Component
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = []
    const showPages = 5

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={!canGoPrevious}
        className="h-8 w-8 p-0"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPageNumbers().map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 p-0"
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={!canGoNext}
        className="h-8 w-8 p-0"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
