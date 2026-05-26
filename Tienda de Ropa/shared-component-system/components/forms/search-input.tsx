"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  onClear?: () => void
}

export function SearchInput({
  className,
  onSearch,
  onClear,
  value,
  onChange,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(value || "")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    onChange?.(e)
    onSearch?.(newValue)
  }

  const handleClear = () => {
    setInternalValue("")
    onClear?.()
    onSearch?.("")
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={internalValue}
        onChange={handleChange}
        className="pl-9 pr-9"
        {...props}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
