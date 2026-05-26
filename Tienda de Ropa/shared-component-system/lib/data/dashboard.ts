import { queryRows, queryOne } from "@/lib/db/query"

export async function getResumenHoySede(idSede: number) {
  return queryOne<Record<string, unknown>>(
    `SELECT * FROM Ventas.vw_Resumen_Ventas_Hoy_Sede WHERE id_sede = @id_sede`,
    { id_sede: idSede }
  )
}

export async function getVentasUltimos7Dias() {
  return queryRows<Record<string, unknown>>(
    `SELECT * FROM Ventas.vw_Ventas_Ultimos_7_Dias ORDER BY dia`
  )
}

export async function getVentasPorCategoria7Dias() {
  return queryRows<Record<string, unknown>>(
    `SELECT * FROM Ventas.vw_Ventas_Por_Categoria_7Dias ORDER BY total DESC`
  )
}

export async function getTopProductos7Dias() {
  return queryRows<Record<string, unknown>>(
    `SELECT * FROM Ventas.vw_Top_Productos_7Dias`
  )
}

/** Ventas de hoy solo en Central (dashboard local, sin linked server). */
export async function getVentasHoyCentral() {
  return queryRows(
    `SELECT
      s.Nombre AS Sede,
      vc.id_venta,
      vc.Nro_factura,
      vc.Fecha_emision,
      pp.Nombre + ' ' + pp.Apellido AS Cliente_Nombre,
      c.Nit_ci_facturacion AS Cliente_NIT,
      pu.Nombre + ' ' + pu.Apellido AS Cajero_Nombre,
      vc.Metodo_pago,
      vc.Estado,
      vc.Total_neto
    FROM Ventas.Venta_Cabecera vc
    INNER JOIN Persona.Cliente c ON vc.id_cliente = c.id_cliente
    INNER JOIN Persona.Persona pp ON c.id_persona = pp.id_persona
    INNER JOIN Seguridad.Usuario u ON vc.id_usuario = u.id_usuario
    INNER JOIN Persona.Persona pu ON u.id_persona = pu.id_persona
    INNER JOIN Configuracion.Sede s ON vc.id_sede = s.id_sede
    WHERE s.Es_Central = 1
      AND CAST(vc.Fecha_emision AS DATE) = CAST(GETDATE() AS DATE)
    ORDER BY vc.Fecha_emision DESC`
  )
}

export async function countStockCriticoCentral() {
  const row = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM Inventario.Stock_Actual sa
     INNER JOIN Configuracion.Sede s ON sa.id_sede = s.id_sede
     WHERE s.Es_Central = 1 AND (sa.Cantidad = 0 OR sa.Cantidad <= 5)`
  )
  return Number(row?.total ?? 0)
}

/** Productos con stock ≤10 o sin fila en Stock_Actual (cuenta como 0). */
export async function getAlertasStockSede(idSede: number) {
  return queryRows(
    `SELECT
      s.Nombre AS Sede,
      p.id_producto,
      p.Nombre AS Producto,
      p.Talla,
      p.Color,
      ISNULL(sa.Cantidad, 0) AS Cantidad,
      CASE
        WHEN ISNULL(sa.Cantidad, 0) = 0 THEN 'Agotado'
        WHEN sa.Cantidad <= 5 THEN 'Crítico'
        ELSE 'Bajo'
      END AS Nivel_Alerta
    FROM Producto.Producto p
    INNER JOIN Configuracion.Sede s ON s.id_sede = @id_sede
    LEFT JOIN Inventario.Stock_Actual sa
      ON sa.id_producto = p.id_producto AND sa.id_sede = s.id_sede
    WHERE ISNULL(sa.Cantidad, 0) <= 10
    ORDER BY Cantidad, p.Nombre`,
    { id_sede: idSede }
  )
}
