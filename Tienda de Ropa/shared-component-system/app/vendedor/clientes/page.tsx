"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DataTableView } from "@/components/erp/data-table-view"
import { PageToolbar } from "@/components/erp/page-toolbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchJson } from "@/lib/api/fetch-json"
import { rowField, rowStr } from "@/lib/api/row-field"
import { Loader2, Plus, Search } from "lucide-react"

const emptyCrear = {
  nombre: "",
  apellido: "",
  ci: "",
  telefono: "",
  email: "",
  direccion: "",
  nit: "",
}

export default function VendedorClientesPage() {
  const [directorio, setDirectorio] = useState<Record<string, unknown>[]>([])
  const [listQ, setListQ] = useState("")
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [editQ, setEditQ] = useState("")
  const [editHits, setEditHits] = useState<Record<string, unknown>[]>([])
  const [editSearching, setEditSearching] = useState(false)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [editForm, setEditForm] = useState({
    telefono: "",
    email: "",
    direccion: "",
    nit: "",
  })

  const [openCrear, setOpenCrear] = useState(false)
  const [crearForm, setCrearForm] = useState(emptyCrear)
  const [saving, setSaving] = useState(false)

  const loadDirectorio = useCallback(() => {
    setListLoading(true)
    setListError(null)
    const url = listQ.trim()
      ? `/api/vendedor/clientes?q=${encodeURIComponent(listQ.trim())}`
      : "/api/vendedor/clientes"
    fetchJson<{ ok: boolean; clientes?: Record<string, unknown>[]; message?: string }>(
      url
    )
      .then((d) => {
        if (!d.ok) throw new Error(d.message ?? "Error al cargar clientes")
        setDirectorio(d.clientes ?? [])
      })
      .catch((e) =>
        setListError(e instanceof Error ? e.message : "No se pudo cargar")
      )
      .finally(() => setListLoading(false))
  }, [listQ])

  useEffect(() => {
    const t = setTimeout(() => loadDirectorio(), listQ.trim() ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadDirectorio, listQ])

  useEffect(() => {
    const t = editQ.trim()
    if (t.length < 1) {
      setEditHits([])
      setEditRow(null)
      return
    }
    setEditSearching(true)
    const timer = setTimeout(() => {
      fetchJson<{
        ok: boolean
        clientes?: Record<string, unknown>[]
        message?: string
      }>(`/api/vendedor/clientes?q=${encodeURIComponent(t)}`)
        .then((d) => {
          if (!d.ok) throw new Error(d.message ?? "Error al buscar")
          setEditHits(d.clientes ?? [])
        })
        .catch(() => setEditHits([]))
        .finally(() => setEditSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [editQ])

  const post = async (body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const data = await fetchJson<{ ok: boolean; message?: string }>(
        "/api/vendedor/clientes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (!data.ok) throw new Error(data.message ?? "Error en la operación")
      return data
    } finally {
      setSaving(false)
    }
  }

  const crearCliente = async () => {
    try {
      await post({ action: "crear", ...crearForm })
      setOpenCrear(false)
      setCrearForm(emptyCrear)
      loadDirectorio()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const seleccionarParaEditar = async (row: Record<string, unknown>) => {
    const id = Number(rowField(row, "id_cliente"))
    try {
      const d = await fetchJson<{
        ok: boolean
        cliente?: Record<string, unknown>
        message?: string
      }>(`/api/vendedor/clientes?id=${id}`)
      if (!d.ok || !d.cliente) throw new Error(d.message ?? "No se pudo cargar")
      setEditRow(d.cliente)
      setEditForm({
        telefono: rowStr(d.cliente, "Telefono"),
        email: rowStr(d.cliente, "Email"),
        direccion: rowStr(d.cliente, "Direccion"),
        nit: rowStr(d.cliente, "Nit_ci_facturacion"),
      })
      setEditHits([])
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const guardarEdicion = async () => {
    if (!editRow) return
    try {
      await post({
        action: "editar",
        id_cliente: rowField(editRow, "id_cliente"),
        ...editForm,
      })
      setEditRow(null)
      setEditQ("")
      loadDirectorio()
      alert("Cliente actualizado")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const cancelarEdicion = () => {
    setEditRow(null)
    setEditForm({ telefono: "", email: "", direccion: "", nit: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Alta con <strong>sp_Registrar_Cliente_Completo</strong>. Para editar, búsquelo y
            selecciónelo en la pestaña Editar.
          </p>
        </div>
        <Dialog open={openCrear} onOpenChange={setOpenCrear}>
          <DialogTrigger asChild>
            <Button className="bg-brand-600">
              <Plus className="h-4 w-4 mr-1" /> Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {(["nombre", "apellido", "ci", "nit", "telefono", "email"] as const).map(
                (k) => (
                  <div key={k}>
                    <Label>{k}</Label>
                    <Input
                      value={crearForm[k]}
                      onChange={(e) =>
                        setCrearForm({ ...crearForm, [k]: e.target.value })
                      }
                    />
                  </div>
                )
              )}
              <div>
                <Label>direccion</Label>
                <Input
                  value={crearForm.direccion}
                  onChange={(e) =>
                    setCrearForm({ ...crearForm, direccion: e.target.value })
                  }
                />
              </div>
              <Button
                className="w-full bg-brand-600"
                onClick={crearCliente}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="directorio">
        <TabsList>
          <TabsTrigger value="directorio">Directorio</TabsTrigger>
          <TabsTrigger value="editar">Editar cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="directorio" className="space-y-4 mt-4">
          {listError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {listError}
            </p>
          )}
          <PageToolbar
            search={listQ}
            onSearchChange={setListQ}
            searchPlaceholder="Filtrar directorio…"
          />
          {listLoading && directorio.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTableView
              rows={directorio}
              columnKeys={[
                "id_cliente",
                "Nombre_completo",
                "CI",
                "Nit_ci_facturacion",
                "Telefono",
                "Email",
              ]}
              loading={listLoading}
              emptyTitle="Sin clientes en esta sede"
            />
          )}
        </TabsContent>

        <TabsContent value="editar" className="space-y-4 mt-4">
          <div className="rounded-xl border p-4 space-y-3 max-w-lg">
            <Label>Buscar cliente a editar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nombre, CI, NIT o correo…"
                value={editQ}
                onChange={(e) => {
                  setEditQ(e.target.value)
                  if (!e.target.value.trim()) setEditRow(null)
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Escriba y pulse el cliente correcto en la lista. Luego modifique y guarde.
            </p>
            {editSearching && (
              <p className="text-xs text-muted-foreground">Buscando…</p>
            )}
            {editHits.length > 0 && !editRow && (
              <ul className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {editHits.map((c) => (
                  <li key={String(rowField(c, "id_cliente"))}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => seleccionarParaEditar(c)}
                    >
                      <span className="font-medium">{rowStr(c, "Nombre_completo")}</span>
                      <span className="text-muted-foreground ml-2">
                        CI {rowStr(c, "CI")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {editQ.trim().length > 0 && !editSearching && editHits.length === 0 && !editRow && (
              <p className="text-sm text-muted-foreground">Sin coincidencias.</p>
            )}
          </div>

          {editRow && (
            <div className="rounded-xl border p-4 space-y-3 max-w-lg bg-muted/30">
              <div>
                <h2 className="font-semibold">
                  {rowStr(editRow, "Nombre")} {rowStr(editRow, "Apellido")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  #{rowStr(editRow, "id_cliente")} · CI {rowStr(editRow, "CI")} (no editable)
                </p>
              </div>
              {(["telefono", "email", "nit"] as const).map((k) => (
                <div key={k}>
                  <Label>{k}</Label>
                  <Input
                    value={editForm[k]}
                    onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <Label>direccion</Label>
                <Input
                  value={editForm.direccion}
                  onChange={(e) =>
                    setEditForm({ ...editForm, direccion: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-brand-600"
                  onClick={guardarEdicion}
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelarEdicion}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        <Link href="/vendedor/pos" className="text-primary underline">
          Ir al POS
        </Link>
      </p>
    </div>
  )
}
