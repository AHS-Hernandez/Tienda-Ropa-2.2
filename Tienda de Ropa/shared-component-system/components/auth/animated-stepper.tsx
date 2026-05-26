"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface AnimatedStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function AnimatedStepper({ steps, currentStep, onStepClick }: AnimatedStepperProps) {
  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-brand-600"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.3 }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = onStepClick && step.id <= currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: step.id * 0.1 }}
                className={cn(
                  "flex flex-col items-center",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => isClickable && onStepClick(step.id)}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                    isCompleted && "bg-brand-600 border-brand-600 text-white",
                    isCurrent && "bg-brand-600 border-brand-600 text-white",
                    !isCompleted && !isCurrent && "bg-background border-muted text-muted-foreground"
                  )}
                  whileHover={isClickable ? { scale: 1.1 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    step.id
                  )}
                </motion.div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
