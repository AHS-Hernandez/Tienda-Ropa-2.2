"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, Loader2, Pencil, Trash2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { ResenaForm } from "@/components/erp/resena-form"
import { formatMoney, formatDate, ventaEstadoVariant } from "@/lib/format"

interface Pedido {
  id_venta: number
  Nro_factura: string | null
  Fecha_emision: string
  Estado: string
  Total_neto: number
  Metodo_pago: string | null
}

interface ProductoVenta {
  id_producto: number
  nombre: string
  cantidad: number
  precio_unitario: number
}

interface ResenaMia {
  _id: string
  id_producto: number
  rating: number
  titulo: string
  texto: string
}

type ModoEdicion = { tipo: "crear" } | { tipo: "editar"; resena: ResenaMia }

function PedidoDetalle({ idVenta }: { idVenta: number }) {
  const [productos, setProductos] = useState<ProductoVenta[]>([])
  const [resenados, setResenados] = useState<ResenaMia[]>([])
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState<{ [idProducto: number]: ModoEdicion | null }>({})
  const [eliminando, setEliminando] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/cliente/pedidos?id_venta=${idVenta}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setProductos(d.productos ?? [])
          setResenados(d.resenados ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [idVenta])

  const getResena = (idProducto: number) =>
    resenados.find((r) => r.id_producto === idProducto) ?? null

  const eliminarResena = async (resena: ResenaMia) => {
    if (!confirm("¿Eliminar tu reseña? Esta acción no se puede deshacer.")) return
    setEliminando(resena._id)
    try {
      const res = await fetch("/api/cliente/resenas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: resena._id }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setResenados((prev) => prev.filter((r) => r._id !== resena._id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    } finally {
      setEliminando(null)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-4">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  )
  if (!productos.length) return <p className="py-2 text-sm text-muted-foreground">Sin productos</p>

  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Productos</p>
      {productos.map((p) => {
        const resena = getResena(p.id_producto)
        const modoActual = modo[p.id_producto]

        return (
          <div key={p.id_producto} className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {p.cantidad} × {formatMoney(p.precio_unitario)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {resena ? (
                  <>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      ✓ Reseñado
                    </span>
                    <button
                      onClick={() =>
                        setModo((m) => ({
                          ...m,
                          [p.id_producto]:
                            modoActual?.tipo === "editar" ? null : { tipo: "editar", resena },
                        }))
                      }
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                      title="Editar reseña"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => eliminarResena(resena)}
                      disabled={eliminando === resena._id}
                      className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Eliminar reseña"
                    >
                      {eliminando === resena._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                ) : modoActual?.tipo === "crear" ? null : (
                  <button
                    onClick={() => setModo((m) => ({ ...m, [p.id_producto]: { tipo: "crear" } }))}
                    className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Reseñar
                  </button>
                )}
              </div>
            </div>

            {modoActual?.tipo === "crear" && (
              <ResenaForm
                idProducto={p.id_producto}
                idVenta={idVenta}
                nombreProducto={p.nombre}
                onSuccess={() => {
                  setModo((m) => ({ ...m, [p.id_producto]: null }))
                  // recarga reseñas
                  fetch(`/api/cliente/pedidos?id_venta=${idVenta}`)
                    .then((r) => r.json())
                    .then((d) => d.ok && setResenados(d.resenados ?? []))
                }}
                onCancel={() => setModo((m) => ({ ...m, [p.id_producto]: null }))}
              />
            )}

            {modoActual?.tipo === "editar" && (
              <ResenaForm
                idProducto={p.id_producto}
                idVenta={idVenta}
                nombreProducto={p.nombre}
                mode="edit"
                resenaId={modoActual.resena._id}
                initialRating={modoActual.resena.rating}
                initialTitulo={modoActual.resena.titulo}
                initialTexto={modoActual.resena.texto}
                onSuccess={() => {
                  setModo((m) => ({ ...m, [p.id_producto]: null }))
                  fetch(`/api/cliente/pedidos?id_venta=${idVenta}`)
                    .then((r) => r.json())
                    .then((d) => d.ok && setResenados(d.resenados ?? []))
                }}
                onCancel={() => setModo((m) => ({ ...m, [p.id_producto]: null }))}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ClientePedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/cliente/pedidos")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.message)
        setPedidos(d.pedidos)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        <p className="text-sm text-muted-foreground">Ventas.vw_Monitor_Ventas_Cabecera</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : pedidos.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Sin pedidos</p>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => {
            const isOpen = expandido === p.id_venta
            const completada = p.Estado === "Completada" || p.Estado === "Entregada"

            return (
              <div key={p.id_venta} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandido(isOpen ? null : p.id_venta)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">
                      {p.Nro_factura ?? `Venta #${p.id_venta}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.Fecha_emision)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge variant={ventaEstadoVariant(p.Estado)} dot>
                      {p.Estado}
                    </StatusBadge>
                    <span className="text-sm font-bold">{formatMoney(p.Total_neto)}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4">
                    {p.Metodo_pago && (
                      <p className="pt-2 text-xs text-muted-foreground">Pago: {p.Metodo_pago}</p>
                    )}
                    {completada ? (
                      <PedidoDetalle idVenta={p.id_venta} />
                    ) : (
                      <p className="pt-2 text-sm text-muted-foreground">
                        Solo puedes reseñar pedidos completados.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
