"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Loader2, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function EmailVerificationPage() {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = async () => {
    setIsResending(true);
    
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsResending(false);
    setCountdown(60);
    setCanResend(false);
  };

  return (
    <AuthLayout showBranding={false}>
      <AuthCard className="text-center">
        {/* Email Icon Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Mail className="w-12 h-12 text-brand-600" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-foreground">Verifica tu correo</h2>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
            Hemos enviado un enlace de verificación a tu correo electrónico. Por favor revisa tu bandeja de entrada.
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-xl bg-muted/50"
        >
          {canResend ? (
            <p className="text-sm text-muted-foreground">
              ¿No recibiste el correo? Puedes solicitar uno nuevo.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Puedes reenviar el correo en{" "}
              <span className="font-mono font-bold text-foreground">{countdown}s</span>
            </p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 space-y-3"
        >
          <Button
            onClick={handleResend}
            disabled={!canResend || isResending}
            variant={canResend ? "default" : "outline"}
            className={`w-full h-12 rounded-xl ${canResend ? "bg-brand-600 hover:bg-brand-700 text-white" : ""}`}
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reenviar correo de verificación
              </>
            )}
          </Button>

          <Link href="/auth/login">
            <Button variant="ghost" className="w-full">
              Volver al inicio de sesión
            </Button>
          </Link>
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-xs text-muted-foreground"
        >
          Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
        </motion.p>
      </AuthCard>
    </AuthLayout>
  );
}
