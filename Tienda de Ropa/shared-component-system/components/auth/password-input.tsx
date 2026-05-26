"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, X, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  error?: string;
  id?: string;
  name?: string;
}

const strengthChecks = [
  { label: "Al menos 8 caracteres", check: (p: string) => p.length >= 8 },
  { label: "Una letra mayúscula", check: (p: string) => /[A-Z]/.test(p) },
  { label: "Una letra minúscula", check: (p: string) => /[a-z]/.test(p) },
  { label: "Un número", check: (p: string) => /[0-9]/.test(p) },
];

export function PasswordInput({
  value,
  onChange,
  placeholder = "Contraseña",
  showStrength = false,
  error,
  id,
  name,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const passedChecks = strengthChecks.filter((c) => c.check(value)).length;
  const strengthPercent = (passedChecks / strengthChecks.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercent <= 25) return "bg-destructive";
    if (strengthPercent <= 50) return "bg-orange-500";
    if (strengthPercent <= 75) return "bg-yellow-500";
    return "bg-brand-600";
  };

  const getStrengthLabel = () => {
    if (strengthPercent <= 25) return "Débil";
    if (strengthPercent <= 50) return "Regular";
    if (strengthPercent <= 75) return "Buena";
    return "Fuerte";
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10 h-12 rounded-xl transition-all",
            error && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Eye className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      <AnimatePresence>
        {showStrength && value.length > 0 && (isFocused || passedChecks < 4) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-2"
          >
            {/* Strength Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Fortaleza</span>
                <span className={cn(
                  "font-medium",
                  strengthPercent <= 25 && "text-destructive",
                  strengthPercent > 25 && strengthPercent <= 50 && "text-orange-500",
                  strengthPercent > 50 && strengthPercent <= 75 && "text-yellow-500",
                  strengthPercent > 75 && "text-brand-600"
                )}>
                  {getStrengthLabel()}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${strengthPercent}%` }}
                  className={cn("h-full rounded-full transition-colors", getStrengthColor())}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-2">
              {strengthChecks.map((check, i) => {
                const passed = check.check(value);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    {passed ? (
                      <Check className="w-3.5 h-3.5 text-brand-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={passed ? "text-foreground" : "text-muted-foreground"}>
                      {check.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
