"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Text Input with Label
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function TextInput({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: TextInputProps) {
  const inputId = id || React.useId()

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId} className={error ? "text-destructive" : ""}>
          {label}
        </Label>
      )}
      <Input
        id={inputId}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// Password Input
interface PasswordInputProps extends Omit<TextInputProps, "type"> {
  showToggle?: boolean
}

export function PasswordInput({
  label = "Contraseña",
  showToggle = true,
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Text Area with Label
interface TextAreaInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function TextAreaInput({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: TextAreaInputProps) {
  const inputId = id || React.useId()

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId} className={error ? "text-destructive" : ""}>
          {label}
        </Label>
      )}
      <Textarea
        id={inputId}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// Select Input
interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { label: string; value: string }[]
  placeholder?: string
}

export function SelectInput({
  label,
  error,
  hint,
  options,
  placeholder = "Seleccionar...",
  className,
  id,
  ...props
}: SelectInputProps) {
  const inputId = id || React.useId()

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId} className={error ? "text-destructive" : ""}>
          {label}
        </Label>
      )}
      <select
        id={inputId}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
