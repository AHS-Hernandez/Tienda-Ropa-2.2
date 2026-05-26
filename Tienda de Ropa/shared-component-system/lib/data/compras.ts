import { getDbPool, sql } from "@/lib/db"
import { queryRows } from "@/lib/db/query"

export async function registrarProveedor(params: {
  razonSocial: string
  nit: string
  contacto: string
  telefono: string
  email: string
  direccion: string
}) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("Razon_social", sql.NVarChar(150), params.razonSocial)
    .input("Nit", sql.NVarChar(50), params.nit)
    .input("Contacto_nombre", sql.NVarChar(100), params.contacto)
    .input("Telefono", sql.NVarChar(50), params.telefono)
    .input("Email", sql.NVarChar(100), params.email)
    .input("Direccion", sql.NVarChar(sql.MAX), params.direccion)
    .execute("Compras.sp_Registrar_Proveedor")
}

export async function modificarProveedor(params: {
  idProveedor: number
  razonSocial?: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
}) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_proveedor", sql.Int, params.idProveedor)
    .input("Razon_social", sql.NVarChar(150), params.razonSocial ?? null)
    .input("Contacto_nombre", sql.NVarChar(100), params.contacto ?? null)
    .input("Telefono", sql.NVarChar(50), params.telefono ?? null)
    .input("Email", sql.NVarChar(100), params.email ?? null)
    .input("Direccion", sql.NVarChar(sql.MAX), params.direccion ?? null)
    .execute("Compras.sp_Modificar_Datos_Proveedor")
}

export async function emitirOrdenCompra(
  idProveedor: number,
  totalCompra: number,
  detalles: { id_producto: number; cantidad: number; costo: number }[]
) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_proveedor", sql.Int, idProveedor)
    .input("total_compra", sql.Decimal(10, 2), totalCompra)
    .input("detalles_json", sql.NVarChar(sql.MAX), JSON.stringify(detalles))
    .execute("Compras.sp_Emitir_Orden_Compra")
}

export async function anularOrdenCompra(idCompra: number) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_compra", sql.Int, idCompra)
    .execute("Compras.sp_Anular_Orden_Compra")
}

export async function consolidarRecepcion(idCompra: number) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_compra", sql.Int, idCompra)
    .execute("Compras.sp_Consolidar_Recepcion_Mercaderia")
}
