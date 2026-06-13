"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2, Plus, Trash2, ShieldAlert, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Umbral {
  id_subcategoria: number
  Stock_minimo: number
  subcategoria: string
  categoria: string
}

interface Alerta {
  id_sede: number
  id_producto: number
  producto: string
  subcategoria: string
  stock_actual: number
  umbral: number
}

interface Subcategoria {
  id_subcategoria: number
  subcategoria: string
  categoria: string
}

export default function OwnerUmbralesPage() {
  const [umbrales, setUmbrales] = useState<Umbral[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ id_subcategoria: "", stock_minimo: "5" })
  const [formError, setFormError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [u, a, s] = await Promise.all([
        fetch("/api/owner/umbrales").then((r) => r.json()),
        fetch("/api/owner/umbrales?alertas=1").then((r) => r.json()),
        fetch("/api/owner/umbrales?subcategorias=1").then((r) => r.json()),
      ])
      if (u.ok) setUmbrales(u.umbrales)
      if (a.ok) setAlertas(a.alertas)
      if (s.ok) setSubcategorias(s.subcategorias)
    } catch {
      setError("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.id_subcategoria) { setFormError("Selecciona una subcategoría"); return }
    const min = Number(form.stock_minimo)
    if (isNaN(min) || min < 0) { setFormError("El mínimo debe ser 0 o mayor"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/owner/umbrales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_subcategoria: form.id_subcategoria, stock_minimo: min }),
      })
      const data = await res.json()
      if (!data.ok) { setFormError(data.message); return }
      setForm({ id_subcategoria: "", stock_minimo: "5" })
      await load()
    } catch {
      setFormError("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleEditGuardar = async (u: Umbral) => {
    const min = Number(editValue)
    if (isNaN(min) || min < 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/owner/umbrales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_subcategoria: u.id_subcategoria, stock_minimo: min }),
      })
      const data = await res.json()
      if (data.ok) { setEditingId(null); await load() }
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (u: Umbral) => {
    if (!confirm(`¿Eliminar umbral de "${u.subcategoria}"?`)) return
    setDeletingId(u.id_subcategoria)
    try {
      await fetch("/api/owner/umbrales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_subcategoria: u.id_subcategoria }),
      })
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  const nivelAlerta = (actual: number, umbral: number) => {
    const ratio = umbral > 0 ? actual / umbral : 0
    if (ratio === 0) return "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
    if (ratio <= 0.5) return "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400"
    return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
  }

  // Subcategorías que aún no tienen umbral configurado
  const sinUmbral = subcategorias.filter(
    (sc) => !umbrales.some((u) => u.id_subcategoria === sc.id_subcategoria)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Umbrales de Stock</h1>
        <p className="text-sm text-muted-foreground">
          Define el stock mínimo aceptable por subcategoría. Se aplica automáticamente a todas las sedes.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Tabs defaultValue="umbrales">
        <TabsList>
          <TabsTrigger value="umbrales" className="gap-2">
            <Settings2 className="h-4 w-4" /> Umbrales configurados
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> Alertas activas
            {alertas.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {alertas.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB UMBRALES ── */}
        <TabsContent value="umbrales" className="space-y-5 pt-2">

          {/* Formulario */}
          <form onSubmit={handleGuardar} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Nuevo umbral
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-48 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Subcategoría</label>
                <select
                  value={form.id_subcategoria}
                  onChange={(e) => setForm((f) => ({ ...f, id_subcategoria: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Seleccionar…</option>
                  {sinUmbral.map((sc) => (
                    <option key={sc.id_subcategoria} value={sc.id_subcategoria}>
                      {sc.categoria} › {sc.subcategoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-36 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Stock mínimo</label>
                <input
                  type="number"
                  min={0}
                  value={form.stock_minimo}
                  onChange={(e) => setForm((f) => ({ ...f, stock_minimo: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </form>

          {/* Tabla */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : umbrales.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay umbrales configurados. Agrega uno arriba.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Categoría</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Subcategoría</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Stock mínimo</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {umbrales.map((u) => {
                    const isEditing = editingId === u.id_subcategoria
                    const isDeleting = deletingId === u.id_subcategoria
                    return (
                      <tr key={u.id_subcategoria} className="bg-card hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{u.categoria}</td>
                        <td className="px-4 py-3 font-medium">{u.subcategoria}</td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <input
                              autoFocus
                              type="number"
                              min={0}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditGuardar(u)
                                if (e.key === "Escape") setEditingId(null)
                              }}
                              className="w-20 rounded-lg border border-primary px-2 py-1 text-center text-sm outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => { setEditingId(u.id_subcategoria); setEditValue(String(u.Stock_minimo)) }}
                              className="rounded-lg border border-border bg-muted/50 px-3 py-1 font-mono font-semibold hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                              {u.Stock_minimo}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing && (
                              <>
                                <Button size="sm" onClick={() => handleEditGuardar(u)} disabled={saving}>
                                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  Cancelar
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEliminar(u)}
                              disabled={isDeleting || saving}
                              className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              {isDeleting
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB ALERTAS ── */}
        <TabsContent value="alertas" className="space-y-3 pt-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : alertas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="rounded-full bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <ShieldAlert className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Sin alertas activas</p>
              <p className="text-xs text-muted-foreground">Todos los productos están sobre su umbral mínimo</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {alertas.length} producto{alertas.length !== 1 ? "s" : ""} bajo el umbral configurado
              </p>
              <div className="space-y-2">
                {alertas.map((a) => {
                  const ratio = a.umbral > 0 ? a.stock_actual / a.umbral : 0
                  const pct = Math.min(100, Math.round(ratio * 100))
                  return (
                    <div
                      key={`${a.id_sede}-${a.id_producto}`}
                      className={`rounded-xl border p-4 space-y-2 ${nivelAlerta(a.stock_actual, a.umbral)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <p className="text-sm font-semibold">{a.producto}</p>
                          </div>
                          <p className="text-xs opacity-75">{a.subcategoria} · Sede {a.id_sede}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold leading-none">{a.stock_actual}</p>
                          <p className="text-[10px] opacity-70">mín. {a.umbral}</p>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-current opacity-60 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
