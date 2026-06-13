"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { ModernTable, type Column } from "@/components/tables/modern-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const emptyContratar = {
  nombre: "",
  apellido: "",
  ci: "",
  telefono: "",
  email: "",
  direccion: "",
  fecha_contratacion: new Date().toISOString().slice(0, 10),
  salario: "",
  crear_usuario: false,
  username: "",
  password: "",
  nivel_acceso: "2",
}

export default function OwnerEmpleadosPage() {
  const [directorio, setDirectorio] = useState<Record<string, unknown>[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [editQ, setEditQ] = useState("")
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [salarioEdit, setSalarioEdit] = useState("")

  const [openContratar, setOpenContratar] = useState(false)
  const [contratarForm, setContratarForm] = useState(emptyContratar)
  const [saving, setSaving] = useState(false)

  const loadDirectorio = useCallback(() => {
    setListLoading(true)
    setListError(null)
    fetchJson<{ ok: boolean; empleados?: Record<string, unknown>[]; message?: string }>(
      "/api/owner/empleados"
    )
      .then((d) => {
        if (!d.ok) throw new Error(d.message ?? "Error al cargar empleados")
        setDirectorio(d.empleados ?? [])
      })
      .catch((e) =>
        setListError(e instanceof Error ? e.message : "No se pudo cargar")
      )
      .finally(() => setListLoading(false))
  }, [])

  useEffect(() => {
    loadDirectorio()
  }, [loadDirectorio])

  const post = async (body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const data = await fetchJson<{ ok: boolean; message?: string }>(
        "/api/owner/empleados",
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

  const contratar = async () => {
    try {
      await post({
        action: "contratar",
        nombre: contratarForm.nombre,
        apellido: contratarForm.apellido,
        ci: contratarForm.ci,
        telefono: contratarForm.telefono,
        email: contratarForm.email,
        direccion: contratarForm.direccion,
        fecha_contratacion: contratarForm.fecha_contratacion,
        salario: Number(contratarForm.salario),
        crear_usuario: contratarForm.crear_usuario,
        username: contratarForm.username,
        password: contratarForm.password,
        nivel_acceso: Number(contratarForm.nivel_acceso),
      })
      setOpenContratar(false)
      setContratarForm(emptyContratar)
      loadDirectorio()
      alert("Empleado contratado en Central")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const seleccionarParaEditar = async (row: Record<string, unknown>) => {
    const id = Number(rowField(row, "id_empleado"))
    try {
      const d = await fetchJson<{
        ok: boolean
        empleado?: Record<string, unknown>
        message?: string
      }>(`/api/owner/empleados?id=${id}`)
      if (!d.ok || !d.empleado) throw new Error(d.message ?? "No se pudo cargar")
      setEditRow(d.empleado)
      setSalarioEdit(String(rowField(d.empleado, "Salario_base") ?? ""))
      setEditQ(rowStr(d.empleado, "Nombre_completo"))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const guardarSalario = async () => {
    if (!editRow) return
    try {
      await post({
        action: "editar_salario",
        id_empleado: rowField(editRow, "id_empleado"),
        salario: Number(salarioEdit),
      })
      setEditRow(null)
      setEditQ("")
      loadDirectorio()
      alert("Salario actualizado")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const editHits =
    editQ.trim().length > 0
      ? directorio.filter((e) => {
          const q = editQ.toLowerCase()
          const nombre = rowStr(e, "Nombre_completo").toLowerCase()
          const ci = rowStr(e, "CI").toLowerCase()
          return nombre.includes(q) || ci.includes(q)
        })
      : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empleados — Central</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Contratar personal en la sede <strong>Central</strong>. Acceso: vendedor (2) o admin
            sede (3).
          </p>
        </div>
        <Dialog open={openContratar} onOpenChange={setOpenContratar}>
          <DialogTrigger asChild>
            <Button className="bg-brand-600">
              <Plus className="h-4 w-4 mr-1" /> Contratar empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contratar en Central</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs rounded-lg bg-muted px-3 py-2">
                Sede: <strong>Central</strong> (automático)
              </p>
              {(["nombre", "apellido", "ci", "telefono", "email"] as const).map((k) => (
                <div key={k}>
                  <Label>{k}</Label>
                  <Input
                    value={contratarForm[k]}
                    onChange={(e) =>
                      setContratarForm({ ...contratarForm, [k]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div>
                <Label>direccion</Label>
                <Input
                  value={contratarForm.direccion}
                  onChange={(e) =>
                    setContratarForm({ ...contratarForm, direccion: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>fecha_contratacion</Label>
                <Input
                  type="date"
                  value={contratarForm.fecha_contratacion}
                  onChange={(e) =>
                    setContratarForm({
                      ...contratarForm,
                      fecha_contratacion: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>salario</Label>
                <Input
                  type="number"
                  value={contratarForm.salario}
                  onChange={(e) =>
                    setContratarForm({ ...contratarForm, salario: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contratarForm.crear_usuario}
                  onChange={(e) =>
                    setContratarForm({
                      ...contratarForm,
                      crear_usuario: e.target.checked,
                    })
                  }
                />
                Crear acceso al sistema
              </label>
              {contratarForm.crear_usuario && (
                <>
                  <div>
                    <Label>Email (username)</Label>
                    <Input
                      value={contratarForm.username}
                      onChange={(e) =>
                        setContratarForm({ ...contratarForm, username: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={contratarForm.password}
                      onChange={(e) =>
                        setContratarForm({ ...contratarForm, password: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Rol de acceso</Label>
                    <Select
                      value={contratarForm.nivel_acceso}
                      onValueChange={(v) =>
                        setContratarForm({ ...contratarForm, nivel_acceso: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">Vendedor</SelectItem>
                        <SelectItem value="3">Admin sede</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <Button
                className="w-full bg-brand-600"
                onClick={contratar}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Contratar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="directorio">
        <TabsList>
          <TabsTrigger value="directorio">Directorio Central</TabsTrigger>
          <TabsTrigger value="editar">Editar salario</TabsTrigger>
        </TabsList>

        <TabsContent value="directorio" className="space-y-4 mt-4">
          {listError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {listError}
            </p>
          )}
          {listLoading && directorio.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ModernTable
              data={directorio}
              columns={[
                { key: "Nombre_completo", header: "Nombre" },
                { key: "CI", header: "CI" },
                { key: "Telefono", header: "Teléfono" },
                { key: "Email", header: "Email" },
                { key: "Fecha_contratacion", header: "Fecha contratación" },
                { key: "Salario_base", header: "Salario" },
              ] as Column<Record<string, unknown>>[]}
              keyExtractor={(r) => String(rowField(r, "id_empleado") ?? JSON.stringify(r))}
              loading={listLoading}
              actions={[
                {
                  label: "Desactivar",
                  variant: "destructive",
                  onClick: async (item) => {
                    const id = Number(rowField(item, "id_empleado"))
                    if (!id) return alert("id_empleado inválido")
                    if (!confirm("Desactivar empleado? Esta acción es irreversible.")) return
                    setSaving(true)
                    try {
                      const res = await fetchJson<{ ok: boolean; message?: string }>(
                        "/api/owner/empleados",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "desactivar", id_empleado: id }),
                        }
                      )
                      if (!res.ok) throw new Error(res.message ?? "Error")
                      alert("Empleado desactivado")
                      loadDirectorio()
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Error")
                    } finally {
                      setSaving(false)
                    }
                  },
                },
              ]}
            />
          )}
        </TabsContent>

        <TabsContent value="editar" className="space-y-4 mt-4">
          <div className="rounded-xl border p-4 space-y-3 max-w-lg">
            <Label>Buscar empleado</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nombre o CI…"
                value={editQ}
                onChange={(e) => {
                  setEditQ(e.target.value)
                  if (!e.target.value.trim()) setEditRow(null)
                }}
              />
            </div>
            {editHits.length > 0 && !editRow && (
              <ul className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {editHits.map((e) => (
                  <li key={String(rowField(e, "id_empleado"))}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => seleccionarParaEditar(e)}
                    >
                      <span className="font-medium">{rowStr(e, "Nombre_completo")}</span>
                      <span className="text-muted-foreground ml-2">
                        CI {rowStr(e, "CI")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {editRow && (
            <div className="rounded-xl border p-4 space-y-3 max-w-lg bg-muted/30">
              <div>
                <h2 className="font-semibold">{rowStr(editRow, "Nombre_completo")}</h2>
                <p className="text-sm text-muted-foreground">
                  #{rowStr(editRow, "id_empleado")} · Central
                </p>
              </div>
              <div>
                <Label>Salario base</Label>
                <Input
                  type="number"
                  value={salarioEdit}
                  onChange={(e) => setSalarioEdit(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-brand-600"
                  onClick={guardarSalario}
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Guardar salario"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditRow(null)
                    setEditQ("")
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
