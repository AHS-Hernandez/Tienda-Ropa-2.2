"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard, AuthHeader } from "@/components/auth/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("El correo es requerido");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Correo inválido");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSuccess(true);
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <AuthLayout showBranding={false}>
        <AuthCard className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-brand-600" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-foreground">Correo enviado</h2>
            <p className="mt-2 text-muted-foreground">
              Hemos enviado instrucciones para restablecer tu contraseña a{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 space-y-3"
          >
            <Link href="/auth/login">
              <Button className="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white">
                Volver al inicio de sesión
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setIsSuccess(false);
                setEmail("");
              }}
              className="w-full"
            >
              Intentar con otro correo
            </Button>
          </motion.div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout showBranding={false}>
      <AuthCard>
        <AuthHeader
          title="Recuperar contraseña"
          description="Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña"
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className={`pl-10 h-12 rounded-xl ${error ? "border-destructive" : ""}`}
              />
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar instrucciones"
              )}
            </Button>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Link href="/auth/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </Button>
          </Link>
        </motion.div>
      </AuthCard>
    </AuthLayout>
  );
}
