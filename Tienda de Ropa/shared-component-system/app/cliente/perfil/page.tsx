"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ClientePerfilPage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.ok && setUser(d.user))
  }, [])

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesión activa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Nombre:</span> {String(user.nombreCompleto)}</p>
          <p><span className="text-muted-foreground">Usuario:</span> @{String(user.username)}</p>
          <p><span className="text-muted-foreground">Sede:</span> #{String(user.id_sede)}</p>
          <p><span className="text-muted-foreground">Nivel:</span> {String(user.nivelAcceso)}</p>
          <p className="text-xs text-muted-foreground pt-2">
            Datos de cliente: sp_Obtener_Cliente_Por_Usuario (próximo paso UI)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
