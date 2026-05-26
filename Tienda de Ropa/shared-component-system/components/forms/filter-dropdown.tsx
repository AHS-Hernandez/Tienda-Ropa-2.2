"use client"

import * as React from "react"
import { Check, ChevronDown, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FilterOption {
  label: string
  value: string
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  multiple?: boolean
  className?: string
}

export function FilterDropdown({
  label,
  options,
  value = [],
  onChange,
  multiple = true,
  className,
}: FilterDropdownProps) {
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
      onChange?.(newValue)
    } else {
      onChange?.(value.includes(optionValue) ? [] : [optionValue])
    }
  }

  const selectedCount = value.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2",
            selectedCount > 0 && "border-primary/50 bg-primary/5",
            className
          )}
        >
          <Filter className="h-4 w-4" />
          {label}
          {selectedCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              {selectedCount}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          {label}
          {selectedCount > 0 && (
            <button
              onClick={() => onChange?.([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={() => handleSelect(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ActiveFiltersProps {
  filters: { key: string; label: string; value: string }[]
  onRemove: (key: string, value: string) => void
  onClearAll?: () => void
  className?: string
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((filter, index) => (
        <span
          key={`${filter.key}-${filter.value}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
        >
          <span className="text-muted-foreground">{filter.label}:</span>
          {filter.value}
          <button
            onClick={() => onRemove(filter.key, filter.value)}
            className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Limpiar todo
        </button>
      )}
    </div>
  )
}
