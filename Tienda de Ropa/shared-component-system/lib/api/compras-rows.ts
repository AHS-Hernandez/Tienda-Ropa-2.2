import { rowField, rowStr } from "@/lib/api/row-field"
import { sanitizeRow } from "@/lib/api/sanitize-rows"

export function normalizeProveedorRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const s = sanitizeRow(row)
  return {
    id_proveedor: rowField(s, "id_proveedor"),
    Razon_social: rowStr(s, "Razon_social"),
    Nit: rowStr(s, "Nit"),
    Contacto_nombre: rowStr(s, "Contacto_nombre"),
    Telefono: rowStr(s, "Telefono"),
    Email: rowStr(s, "Email"),
    Direccion: rowStr(s, "Direccion"),
  }
}

export function normalizeCompraRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const s = sanitizeRow(row)
  return {
    id_compra: rowField(s, "id_compra"),
    Fecha_Emision: rowField(s, "Fecha_Emision", "Fecha"),
    Proveedor: rowStr(s, "Proveedor"),
    NIT_Proveedor: rowStr(s, "NIT_Proveedor", "Nit"),
    Estado: rowStr(s, "Estado"),
    Total_compra: rowField(s, "Total_compra"),
  }
}
