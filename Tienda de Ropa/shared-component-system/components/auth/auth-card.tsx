"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-card rounded-3xl border border-border/50 shadow-xl shadow-black/5 dark:shadow-black/20 p-8",
        "backdrop-blur-sm",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface AuthHeaderProps {
  title: string;
  description?: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-center mb-8"
    >
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}

interface AuthDividerProps {
  text?: string;
}

export function AuthDivider({ text = "o continuar con" }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-3 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
}
