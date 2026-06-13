import { queryRows, queryOne } from "@/lib/db/query"
import { getDbPool, sql } from "@/lib/db"

export interface VentaLinea {
  id_detalle: number
  id_venta: number
  id_producto: number
  nombre: string
  color: string | null
  talla: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface VentaCabecera {
  id_venta: number
  nro_factura: string | null
  fecha_emision: Date
  estado: string
  total_bruto: number
  total_descuento: number
  total_neto: number
  metodo_pago: string | null
  cliente_nombre?: string
}

export async function obtenerIdClientePorUsuario(
  idUsuario: number
): Promise<number | null> {
  const pool = await getDbPool()
  const result = await pool
    .request()
    .input("IdUsuario", sql.Int, idUsuario)
    .execute<{ id_cliente: number }>("Seguridad.sp_Obtener_Cliente_Por_Usuario")
  return result.recordset[0]?.id_cliente ?? null
}

export async function crearVentaBorrador(
  idCliente: number,
  idUsuario: number,
  idSede: number
): Promise<number> {
  const pool = await getDbPool()

  // Verificar si ya existe un borrador activo para este cliente
  const existente = await pool
    .request()
    .input("id_cliente", sql.Int, idCliente)
    .query<{ id_venta: number }>(
      `SELECT TOP 1 id_venta FROM Ventas.Venta_Cabecera
       WHERE id_cliente = @id_cliente AND Estado = 'Borrador'
       ORDER BY id_venta DESC`
    )

  const idExistente = existente.recordset[0]?.id_venta
  if (idExistente) return idExistente

  // No existe: crear uno nuevo
  let id = 0
  try {
    const result = await pool
      .request()
      .input("id_cliente", sql.Int, idCliente)
      .input("id_usuario", sql.Int, idUsuario)
      .input("id_sede", sql.Int, idSede)
      .output("id_venta_generado", sql.Int)
      .execute("Ventas.sp_Crear_Venta_Borrador")
    id = Number(result.output.id_venta_generado)
  } catch (spErr: unknown) {
    const msg = (spErr as Error)?.message ?? ""
    // Si falla por constraint duplicada: puede haber creado uno por race condition
    if (msg.includes("UNIQUE KEY") || msg.includes("duplicate key")) {
      const retry = await pool
        .request()
        .input("id_cliente", sql.Int, idCliente)
        .query<{ id_venta: number }>(
          `SELECT TOP 1 id_venta FROM Ventas.Venta_Cabecera
           WHERE id_cliente = @id_cliente AND Estado = 'Borrador'
           ORDER BY id_venta DESC`
        )
      id = retry.recordset[0]?.id_venta ?? 0
      if (!id) {
        throw new Error(
          "No se puede crear el carrito: existe un borrador activo en el sistema. " +
          "Ejecute en SSMS: ALTER TABLE Ventas.Venta_Cabecera DROP CONSTRAINT UQ__Venta_Ca__D79AE96B784AFECA; " +
          "CREATE UNIQUE NONCLUSTERED INDEX UIX_VC_NroFactura ON Ventas.Venta_Cabecera (Nro_factura) WHERE Nro_factura IS NOT NULL;"
        )
      }
    } else {
      throw spErr
    }
  }

  if (!id) {
    const fallback = await pool
      .request()
      .input("id_cliente", sql.Int, idCliente)
      .query<{ id_venta: number }>(
        `SELECT TOP 1 id_venta FROM Ventas.Venta_Cabecera
         WHERE id_cliente = @id_cliente AND Estado = 'Borrador'
         ORDER BY id_venta DESC`
      )
    id = fallback.recordset[0]?.id_venta ?? 0
  }
  if (!id) throw new Error("No se generó el borrador de venta.")
  return id
}

export async function agregarProductoVenta(
  idVenta: number,
  idProducto: number,
  cantidad: number
): Promise<void> {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_venta", sql.Int, idVenta)
    .input("id_producto", sql.Int, idProducto)
    .input("cantidad", sql.Int, cantidad)
    .execute("Ventas.sp_Agregar_Producto_Venta")
}

export async function eliminarLineaVenta(idDetalle: number): Promise<void> {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_detalle", sql.Int, idDetalle)
    .execute("Ventas.sp_Eliminar_Producto_Venta")
}

export async function procesarCobroVenta(
  idVenta: number,
  metodoPago: string
): Promise<void> {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_venta", sql.Int, idVenta)
    .input("metodo_pago", sql.NVarChar(50), metodoPago)
    .execute("Ventas.sp_Procesar_Cobro_Venta")
}

export async function anularVentaBorrador(idVenta: number): Promise<void> {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_venta", sql.Int, idVenta)
    .execute("Ventas.sp_Anular_Venta_Borrador")
}

/** Líneas del borrador vía vista (fallback a tabla si la vista no existe aún). */
export async function getLineasVenta(idVenta: number): Promise<VentaLinea[]> {
  const sqlVista = `SELECT
      id_detalle, id_venta, id_producto, nombre, color, talla,
      cantidad, precio_unitario, subtotal
    FROM Ventas.vw_Venta_Borrador_Linea
    WHERE id_venta = @id_venta ORDER BY id_detalle`
  const sqlTabla = `SELECT
      vd.id_detalle, vd.id_venta, vd.id_producto,
      vd.Nombre AS nombre, vd.Color AS color, vd.Talla AS talla,
      vd.Cantidad AS cantidad, vd.Precio_unitario AS precio_unitario, vd.Subtotal AS subtotal
    FROM Ventas.Venta_Detalle vd
    INNER JOIN Ventas.Venta_Cabecera vc ON vc.id_venta = vd.id_venta
    WHERE vd.id_venta = @id_venta AND vc.Estado = 'Borrador'
    ORDER BY vd.id_detalle`
  try {
    return await queryRows<VentaLinea>(sqlVista, { id_venta: idVenta })
  } catch {
    return queryRows<VentaLinea>(sqlTabla, { id_venta: idVenta })
  }
}

export async function getCabeceraVenta(
  idVenta: number
): Promise<VentaCabecera | null> {
  return queryOne<VentaCabecera>(
    `SELECT
      id_venta,
      Nro_factura AS nro_factura,
      Fecha_emision AS fecha_emision,
      Estado AS estado,
      Total_bruto AS total_bruto,
      Total_descuento AS total_descuento,
      Total_neto AS total_neto,
      Metodo_pago AS metodo_pago
    FROM Ventas.Venta_Cabecera
    WHERE id_venta = @id_venta`,
    { id_venta: idVenta }
  )
}

export async function getMonitorVentas(filters: {
  idSede?: number
  idCliente?: number
  soloHoy?: boolean
}): Promise<Record<string, unknown>[]> {
  let sqlText = `SELECT * FROM Ventas.vw_Monitor_Ventas_Cabecera WHERE 1=1`
  const params: Record<string, unknown> = {}

  if (filters.idSede) {
    sqlText += ` AND id_sede = @id_sede`
    params.id_sede = filters.idSede
  }
  if (filters.idCliente) {
    sqlText += ` AND id_venta IN (
      SELECT id_venta FROM Ventas.Venta_Cabecera WHERE id_cliente = @id_cliente
    )`
    params.id_cliente = filters.idCliente
  }
  if (filters.soloHoy) {
    sqlText += ` AND CAST(Fecha_emision AS DATE) = CAST(GETDATE() AS DATE)`
  }
  sqlText += ` ORDER BY Fecha_emision DESC`

  return queryRows(sqlText, params)
}

export async function getFacturaDetalle(idVenta: number): Promise<Record<string, unknown>[]> {
  return queryRows(
    `SELECT * FROM Ventas.vw_Factura_Detallada WHERE id_venta = @id_venta`,
    { id_venta: idVenta }
  )
}

export interface ProductoVenta {
  id_producto: number
  nombre: string
  cantidad: number
  precio_unitario: number
}

export async function getProductosVenta(idVenta: number): Promise<ProductoVenta[]> {
  const rows = await queryRows<Record<string, unknown>>(
    `SELECT vd.id_producto,
            c.Nombre      AS nombre,
            vd.Cantidad   AS cantidad,
            vd.Precio_unitario AS precio_unitario
     FROM Ventas.Venta_Detalle vd
     INNER JOIN Producto.vw_Catalogo_Maestro c ON c.id_producto = vd.id_producto
     WHERE vd.id_venta = @id_venta`,
    { id_venta: idVenta }
  )
  return rows.map((r) => ({
    id_producto: Number(r.id_producto),
    nombre: String(r.nombre),
    cantidad: Number(r.cantidad),
    precio_unitario: Number(r.precio_unitario),
  }))
}
