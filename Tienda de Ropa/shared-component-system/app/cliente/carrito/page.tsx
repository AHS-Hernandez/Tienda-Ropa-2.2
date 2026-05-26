"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2 } from "lucide-react"
import { formatMoney } from "@/lib/format"
import type { VentaCabecera, VentaLinea } from "@/lib/data/ventas"
import Link from "next/link"

export default function ClienteCarritoPage() {
  const [cabecera, setCabecera] = useState<VentaCabecera | null>(null)
  const [lineas, setLineas] = useState<VentaLinea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/cliente/carrito")
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setCabecera(data.cabecera)
      setLineas(data.lineas ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const removeLine = async (idDetalle: number) => {
    const res = await fetch(`/api/cliente/carrito?id_detalle=${idDetalle}`, { method: "DELETE" })
    const data = await res.json()
    if (!data.ok) {
      alert(data.message)
      return
    }
    setCabecera(data.cabecera)
    setLineas(data.lineas ?? [])
  }

  const checkout = async () => {
    setProcessing(true)
    try {
      const res = await fetch("/api/cliente/carrito/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo_pago: metodoPago }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      alert(`Compra exitosa. Factura: ${data.nro_factura ?? "—"}`)
      setCabecera(null)
      setLineas([])
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cobrar")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Carrito</h1>
        <p className="text-sm text-muted-foreground">
          Borrador de venta — sp_Crear_Venta_Borrador / sp_Procesar_Cobro_Venta
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {lineas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Carrito vacío</p>
            <Link href="/cliente/catalogo">
              <Button className="mt-4 bg-brand-600 hover:bg-brand-700">Ir al catálogo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Líneas ({lineas.length})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {lineas.map((l) => (
                <div key={l.id_detalle} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{l.nombre}</p>
                    <p className="text-muted-foreground">
                      {l.talla} · {l.color} · x{l.cantidad}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatMoney(l.subtotal)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => removeLine(l.id_detalle)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Bruto</span>
                <span>{formatMoney(cabecera?.total_bruto ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-primary">
                <span>Descuento</span>
                <span>-{formatMoney(cabecera?.total_descuento ?? 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span>{formatMoney(cabecera?.total_neto ?? 0)}</span>
              </div>

              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="w-full bg-brand-600 hover:bg-brand-700"
                disabled={processing}
                onClick={checkout}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Procesar pago"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
