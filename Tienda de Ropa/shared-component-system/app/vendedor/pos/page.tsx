"use client"

import { useCallback, useEffect, useState } from "react"
import { ProductRow } from "@/components/erp/product-row"
import { PageToolbar } from "@/components/erp/page-toolbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2, User } from "lucide-react"
import { formatMoney } from "@/lib/format"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"
import type { VentaCabecera, VentaLinea } from "@/lib/data/ventas"

interface ClienteHit {
  id_cliente: number
  Nombre_completo: string
  CI: string
  Nit_ci_facturacion: string
}

export default function VendedorPOSPage() {
  const [clienteQ, setClienteQ] = useState("")
  const [clientes, setClientes] = useState<ClienteHit[]>([])
  const [idCliente, setIdCliente] = useState<number | null>(null)
  const [productos, setProductos] = useState<ProductoCatalogoRow[]>([])
  const [prodQ, setProdQ] = useState("")
  const [cabecera, setCabecera] = useState<VentaCabecera | null>(null)
  const [lineas, setLineas] = useState<VentaLinea[]>([])
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)

  const loadVenta = useCallback(async () => {
    const res = await fetch("/api/vendedor/ventas")
    const data = await res.json()
    if (data.ok) {
      setCabecera(data.cabecera)
      setLineas(data.lineas ?? [])
    }
  }, [])

  useEffect(() => {
    loadVenta()
  }, [loadVenta])

  useEffect(() => {
    if (clienteQ.trim().length < 1) {
      setClientes([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/vendedor/clientes?q=${encodeURIComponent(clienteQ)}`)
        .then(async (r) => {
          const text = await r.text()
          if (!text.trim()) return null
          return JSON.parse(text) as { ok: boolean; clientes?: ClienteHit[] }
        })
        .then((d) => d?.ok && setClientes(d.clientes ?? []))
    }, 300)
    return () => clearTimeout(t)
  }, [clienteQ])

  useEffect(() => {
    const t = setTimeout(() => {
      const params = prodQ ? `?q=${encodeURIComponent(prodQ)}` : ""
      fetch(`/api/vendedor/catalogo${params}`)
        .then((r) => r.json())
        .then((d) => d.ok && setProductos(d.productos))
    }, 300)
    return () => clearTimeout(t)
  }, [prodQ])

  const iniciarVenta = async (c: ClienteHit) => {
    setLoading(true)
    try {
      const res = await fetch("/api/vendedor/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nueva", id_cliente: c.id_cliente }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setIdCliente(c.id_cliente)
      setCabecera(data.cabecera)
      setLineas(data.lineas ?? [])
      setClienteQ(c.Nombre_completo)
      setClientes([])
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  const agregar = async (idProducto: number, cantidad: number) => {
    if (!idCliente) {
      alert("Seleccione un cliente primero")
      return
    }
    setAddingId(idProducto)
    try {
      const res = await fetch("/api/vendedor/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          id_cliente: idCliente,
          id_producto: idProducto,
          cantidad,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setCabecera(data.cabecera)
      setLineas(data.lineas ?? [])
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setAddingId(null)
    }
  }

  const quitar = async (idDetalle: number) => {
    const res = await fetch(`/api/vendedor/ventas?id_detalle=${idDetalle}`, { method: "DELETE" })
    const data = await res.json()
    if (data.ok) {
      setCabecera(data.cabecera)
      setLineas(data.lineas ?? [])
    } else alert(data.message)
  }

  const cobrar = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/vendedor/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cobrar", metodo_pago: metodoPago }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      alert(`Cobro OK — ${data.nro_factura}`)
      setCabecera(null)
      setLineas([])
      setIdCliente(null)
      setClienteQ("")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Punto de venta</h1>

      <Card className="border-brand-200 bg-brand-50/50 dark:bg-brand-950/20">
        <CardContent className="pt-4 text-sm text-muted-foreground space-y-1">
          <p><strong>Cómo vender:</strong> 1) Busque y seleccione cliente. 2) Agregue productos con stock. 3) Elija pago y <strong>Cobrar</strong>.</p>
          <p>Usa los mismos SPs que el carrito: sp_Crear_Venta_Borrador → sp_Agregar_Producto_Venta → sp_Procesar_Cobro_Venta.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Nombre, CI, NIT o correo del cliente…"
              value={clienteQ}
              onChange={(e) => setClienteQ(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Escriba 1+ letras o dígitos y pulse un resultado. Ej.: Choque, 9345678, cliente@test.com
          </p>
          {clientes.length > 0 && (
            <ul className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
              {clientes.map((c) => (
                <li key={c.id_cliente}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => iniciarVenta(c)}
                  >
                    <span className="font-medium">{c.Nombre_completo}</span>
                    <span className="text-muted-foreground ml-2">CI {c.CI}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {idCliente && (
            <p className="text-xs text-primary mt-2">Cliente activo #{idCliente}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-3">
          <PageToolbar
            search={prodQ}
            onSearchChange={setProdQ}
            searchPlaceholder="Producto, marca o talla…"
            searchHint="Mismo criterio que el catálogo. Solo se agregan ítems con stock en su sede."
          />
          <div className="grid gap-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {productos.map((p) => (
              <ProductRow
                key={p.id_producto}
                product={p}
                compact
                onAdd={agregar}
                adding={addingId === p.id_producto}
              />
            ))}
          </div>
        </div>

        <Card className="xl:col-span-1 h-fit sticky top-20">
          <CardHeader>
            <CardTitle className="text-base">Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin líneas</p>
            ) : (
              lineas.map((l) => (
                <div key={l.id_detalle} className="flex justify-between text-sm gap-2">
                  <span className="truncate">
                    {l.nombre} x{l.cantidad}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span>{formatMoney(l.subtotal)}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => quitar(l.id_detalle)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <div className="border-t pt-3 font-bold flex justify-between">
              <span>Total</span>
              <span>{formatMoney(cabecera?.total_neto ?? 0)}</span>
            </div>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="w-full bg-brand-600 hover:bg-brand-700"
              disabled={lineas.length === 0 || loading}
              onClick={cobrar}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cobrar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
