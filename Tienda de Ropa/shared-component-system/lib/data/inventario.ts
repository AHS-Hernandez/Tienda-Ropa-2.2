import { queryRows } from "@/lib/db/query"
import { getDbPool, sql } from "@/lib/db"
import { setDbSessionContext } from "@/lib/db/session-context"
import { normalizeFilaStock } from "@/lib/data/stock-display"

const SQL_STOCK_TODOS_LOCAL = `
  SELECT
    s.Nombre AS Sede,
    s.id_sede,
    p.id_producto,
    p.Nombre AS Producto,
    p.Marca,
    p.Talla,
    p.Color,
    ISNULL(sa.Cantidad, 0) AS Cantidad
  FROM Producto.Producto p
  CROSS JOIN Configuracion.Sede s
  LEFT JOIN Inventario.Stock_Actual sa
    ON sa.id_producto = p.id_producto AND sa.id_sede = s.id_sede
  WHERE s.Activa = 1
  ORDER BY s.Nombre, p.Nombre`

const SQL_ALERTAS_LOCAL = `
  SELECT
    s.Nombre AS Sede,
    p.id_producto,
    p.Nombre AS Producto,
    p.Marca,
    p.Talla,
    p.Color,
    sa.Cantidad AS Cantidad,
    CASE
      WHEN sa.Cantidad = 0 THEN 'Agotado'
      WHEN sa.Cantidad <= 5 THEN 'Crítico'
      ELSE 'Bajo'
    END AS Nivel_Alerta
  FROM Inventario.Stock_Actual sa
  INNER JOIN Producto.Producto p ON sa.id_producto = p.id_producto
  INNER JOIN Configuracion.Sede s ON sa.id_sede = s.id_sede
  WHERE sa.Cantidad <= 10
  ORDER BY s.Nombre, sa.Cantidad, p.Nombre`

export async function getStockSede(idSede: number): Promise<Record<string, unknown>[]> {
  return queryRows(
    `SELECT * FROM Inventario.vw_Disponibilidad_Stock
     WHERE id_sede = @id_sede
     ORDER BY Nombre`,
    { id_sede: idSede }
  )
}

export async function getStockCentral(idSedeCentral: number): Promise<Record<string, unknown>[]> {
  const rows = await queryRows<Record<string, unknown>>(
    `SELECT
      s.Nombre AS Sede,
      s.id_sede,
      p.id_producto,
      p.Nombre AS Producto,
      p.Marca,
      p.Talla,
      p.Color,
      ISNULL(sa.Cantidad, 0) AS Cantidad
    FROM Producto.Producto p
    CROSS JOIN Configuracion.Sede s
    LEFT JOIN Inventario.Stock_Actual sa
      ON sa.id_producto = p.id_producto AND sa.id_sede = s.id_sede
    WHERE s.id_sede = @id_sede
    ORDER BY p.Nombre`,
    { id_sede: idSedeCentral }
  )
  return rows.map(normalizeFilaStock)
}

export async function getAlertasStockCentral(
  idSedeCentral: number
): Promise<Record<string, unknown>[]> {
  const rows = await queryRows<Record<string, unknown>>(
    `SELECT
      s.Nombre AS Sede,
      p.id_producto,
      p.Nombre AS Producto,
      p.Marca,
      p.Talla,
      p.Color,
      sa.Cantidad AS Cantidad,
      CASE
        WHEN sa.Cantidad = 0 THEN 'Agotado'
        WHEN sa.Cantidad <= 5 THEN 'Crítico'
        ELSE 'Bajo'
      END AS Nivel_Alerta
    FROM Inventario.Stock_Actual sa
    INNER JOIN Producto.Producto p ON sa.id_producto = p.id_producto
    INNER JOIN Configuracion.Sede s ON sa.id_sede = s.id_sede
    WHERE sa.id_sede = @id_sede AND sa.Cantidad <= 10
    ORDER BY sa.Cantidad, p.Nombre`,
    { id_sede: idSedeCentral }
  )
  return rows.map(normalizeFilaStock)
}

/** Solo filas con registro en Stock_Actual y cantidad ≤ 10 (no marca “agotado” por ausencia de fila). */
export async function getAlertasStock(): Promise<Record<string, unknown>[]> {
  const rows = await queryRows<Record<string, unknown>>(SQL_ALERTAS_LOCAL)
  return rows.map(normalizeFilaStock)
}

export async function getReporteAjustes(
  idSede: number
): Promise<Record<string, unknown>[]> {
  return queryRows(
    `SELECT * FROM Inventario.vw_Reporte_Ajustes
     WHERE id_sede = @id_sede
     ORDER BY Fecha DESC`,
    { id_sede: idSede }
  )
}

export async function ejecutarAjusteInventario(params: {
  idUsuario: number
  idProducto: number
  tipoAjuste: string
  motivo: string
  cantidad: number
  idSede: number
}): Promise<void> {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_usuario", sql.Int, params.idUsuario)
    .input("id_producto", sql.Int, params.idProducto)
    .input("tipo_ajuste", sql.NVarChar(50), params.tipoAjuste)
    .input("motivo", sql.NVarChar(255), params.motivo)
    .input("cantidad", sql.Int, params.cantidad)
    .input("id_sede", sql.Int, params.idSede)
    .execute("Inventario.sp_Ejecutar_Ajuste_Inventario")
}

export async function transferirStock(params: {
  idUsuario: number
  idProducto: number
  idSedeOrigen: number
  idSedeDestino: number
  cantidad: number
}): Promise<void> {
  await setDbSessionContext(params.idUsuario)
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_usuario", sql.Int, params.idUsuario)
    .input("id_producto", sql.Int, params.idProducto)
    .input("id_sede_origen", sql.Int, params.idSedeOrigen)
    .input("id_sede_destino", sql.Int, params.idSedeDestino)
    .input("cantidad", sql.Int, params.cantidad)
    .execute("Inventario.sp_Transferir_Stock")
}
