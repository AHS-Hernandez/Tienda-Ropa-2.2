"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Phone, CreditCard, MapPin, FileText, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard, AuthHeader } from "@/components/auth/auth-card";
import { AnimatedStepper } from "@/components/auth/animated-stepper";
import { PasswordInput } from "@/components/auth/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Personal", description: "Datos básicos" },
  { id: 2, title: "Contacto", description: "Email y dirección" },
  { id: 3, title: "Seguridad", description: "Contraseña" },
];

interface FormData {
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email: string;
  direccion: string;
  nit: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellido: "",
    ci: "",
    telefono: "",
    email: "",
    direccion: "",
    nit: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      if (!formData.nombre) newErrors.nombre = "Nombre requerido";
      if (!formData.apellido) newErrors.apellido = "Apellido requerido";
      if (!formData.ci) newErrors.ci = "CI requerido";
      else if (!/^\d/.test(formData.ci))
        newErrors.ci = "El CI debe comenzar con dígitos (validación del SP)";
      if (!formData.telefono) newErrors.telefono = "Teléfono requerido";
      else if (!/\d/.test(formData.telefono))
        newErrors.telefono = "El teléfono debe contener al menos un número";
    }

    if (step === 2) {
      if (!formData.email) {
        newErrors.email = "Email requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email inválido";
      }
      if (!formData.direccion) newErrors.direccion = "Dirección requerida";
    }

    if (step === 3) {
      if (!formData.password) {
        newErrors.password = "Contraseña requerida";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mínimo 6 caracteres (Seguridad.sp_Registro_Maestro_Cliente)";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = "Debes aceptar los términos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          ci: formData.ci,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          nit: formData.nit || undefined,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormError(data.message ?? "No se pudo registrar la cuenta.");
        return;
      }
      router.push("/auth/register-success");
    } catch {
      setFormError("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    cn("pl-10 h-12 rounded-xl", errors[field] && "border-destructive");

  return (
    <AuthLayout>
      <AuthCard className="max-w-lg">
        <AuthHeader
          title="Crear cuenta"
          description="Únete a La Santa Cruz y disfruta de beneficios exclusivos"
        />

        {/* Stepper */}
        <div className="mb-8">
          <AnimatedStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={(step) => step < currentStep && setCurrentStep(step)}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {formError && (
            <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="nombre"
                        placeholder="Tu nombre"
                        value={formData.nombre}
                        onChange={(e) => updateField("nombre", e.target.value)}
                        className={inputClass("nombre")}
                      />
                    </div>
                    {errors.nombre && (
                      <p className="text-sm text-destructive">{errors.nombre}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="apellido"
                        placeholder="Tu apellido"
                        value={formData.apellido}
                        onChange={(e) => updateField("apellido", e.target.value)}
                        className={inputClass("apellido")}
                      />
                    </div>
                    {errors.apellido && (
                      <p className="text-sm text-destructive">{errors.apellido}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ci">Cédula de Identidad</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="ci"
                      placeholder="12345678"
                      value={formData.ci}
                      onChange={(e) => updateField("ci", e.target.value)}
                      className={inputClass("ci")}
                    />
                  </div>
                  {errors.ci && (
                    <p className="text-sm text-destructive">{errors.ci}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      type="tel"
                      inputMode="numeric"
                      placeholder="70000000"
                      value={formData.telefono}
                      onChange={(e) => updateField("telefono", e.target.value)}
                      className={inputClass("telefono")}
                    />
                  </div>
                  {errors.telefono && (
                    <p className="text-sm text-destructive">{errors.telefono}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Contact Info */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={inputClass("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="direccion"
                      placeholder="Tu dirección completa"
                      value={formData.direccion}
                      onChange={(e) => updateField("direccion", e.target.value)}
                      className={inputClass("direccion")}
                    />
                  </div>
                  {errors.direccion && (
                    <p className="text-sm text-destructive">{errors.direccion}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nit">NIT (Opcional)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nit"
                      placeholder="Para facturación"
                      value={formData.nit}
                      onChange={(e) => updateField("nit", e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Security */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(val) => updateField("password", val)}
                    placeholder="Crea una contraseña segura"
                    showStrength
                    error={errors.password}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(val) => updateField("confirmPassword", val)}
                    placeholder="Repite tu contraseña"
                    error={errors.confirmPassword}
                  />
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => updateField("acceptTerms", checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    Acepto los{" "}
                    <Link href="#" className="text-brand-600 hover:underline">
                      términos y condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link href="#" className="text-brand-600 hover:underline">
                      política de privacidad
                    </Link>
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive">{errors.acceptTerms}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 h-12 rounded-xl"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/auth/login"
            className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
