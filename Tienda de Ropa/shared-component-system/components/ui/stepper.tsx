"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
  steps: { label: string; description?: string }[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !isCompleted && !isCurrent && "border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex-1 px-4">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors duration-200",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// Vertical Stepper
interface VerticalStepperProps {
  steps: { label: string; description?: string; content?: React.ReactNode }[]
  currentStep: number
  className?: string
}

export function VerticalStepper({ steps, currentStep, className }: VerticalStepperProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isCompleted && !isCurrent && "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mt-2 h-full w-0.5 min-h-8",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p
                className={cn(
                  "font-medium",
                  (isCompleted || isCurrent) && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-sm text-muted-foreground">{step.description}</p>
              )}
              {isCurrent && step.content && (
                <div className="mt-3">{step.content}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
