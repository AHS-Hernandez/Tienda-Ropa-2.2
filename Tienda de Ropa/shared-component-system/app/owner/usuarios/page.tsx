"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Loader2, Pencil } from "lucide-react"

export default function OwnerUsuariosPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [empleados, setEmpleados] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<Record<string, unknown> | null>(null)
  const [nivel, setNivel] = useState("2")

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/owner/usuarios")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRows(d.usuarios ?? [])
          setEmpleados(d.empleados ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const editarNivel = async () => {
    if (!editUser) return
    const res = await fetch("/api/owner/usuarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_usuario: editUser.id_usuario,
        nivel_acceso: Number(nivel),
        estado: Number(editUser.Estado) === 1,
      }),
    })
    const data = await res.json()
    if (!data.ok) alert(data.message)
    else {
      setEditUser(null)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios globales</h1>
        <p className="text-sm text-muted-foreground">
          Seguridad.vw_Usuarios_Sistema — editar nivel (sin activar/desactivar)
        </p>
      </div>

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <>
          {rows.map((r) => (
            <div key={Number(r.id_usuario)} className="flex justify-between border rounded-xl p-3">
              <span className="text-sm">
                Sede {String(r.id_sede)} — {String(r.Username)} (nivel {String(r.Nivel_acceso)})
              </span>
              {Number(r.Nivel_acceso) === 4 ? (
                <span className="text-xs text-muted-foreground">Dueño (solo lectura)</span>
              ) : Number(r.Nivel_acceso) > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditUser(r)
                    setNivel(String(r.Nivel_acceso))
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
          <DataTableView
            rows={rows.map((r) => ({
              ...r,
              Estado: Number(r.Estado) === 1 ? "Activo" : "Inactivo",
            }))}
            columnKeys={["id_sede", "Nombre", "Apellido", "Username", "Nivel_acceso", "Estado"]}
          />
          <p className="text-xs text-muted-foreground">
            Empleados en RRHH: {empleados.length} (para crear credenciales use admin de sede)
          </p>
        </>
      )}

      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambiar nivel</DialogTitle></DialogHeader>
          <Label>Nivel 1–3</Label>
          <Select value={nivel} onValueChange={setNivel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={editarNivel} className="w-full mt-4 bg-brand-600">Guardar</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
