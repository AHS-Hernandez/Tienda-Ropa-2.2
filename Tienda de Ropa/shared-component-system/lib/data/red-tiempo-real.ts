import { getDbPool } from "@/lib/db"
import { queryRows } from "@/lib/db/query"
import { getSqlErrorMessage } from "@/lib/db/errors"

export type RedTiempoRealBlock = {
  rows: Record<string, unknown>[]
  error: string | null
  warning: string | null
  linkedError: string | null
  source: "linked" | "local" | "proxy"
}

async function loadLinkedOrCentral(
  linkedSql: string,
  centralSql: string,
  priorError?: string
): Promise<RedTiempoRealBlock> {
  try {
    const rows = await queryRows(linkedSql)
    return {
      rows,
      error: null,
      warning: null,
      linkedError: null,
      source: "linked",
    }
  } catch (linkedErr) {
    const linkedMsg = priorError ?? getSqlErrorMessage(linkedErr)
    try {
      const rows = await queryRows(centralSql)
      return {
        rows,
        error: null,
        warning: "Solo Central. Linked server no disponible.",
        linkedError: linkedMsg,
        source: "local",
      }
    } catch (localErr) {
      return {
        rows: [],
        error: getSqlErrorMessage(localErr),
        warning: null,
        linkedError: linkedMsg,
        source: "local",
      }
    }
  }
}

const SQL = {
  ventasLinked: `SELECT * FROM Ventas.vw_Ventas_Hoy_Global ORDER BY Fecha_emision DESC`,
  ventasCentral: `SELECT
      s.Nombre AS Sede,
      vc.id_venta,
      vc.id_sede,
      vc.Nro_factura,
      vc.Fecha_emision,
      pp.Nombre + ' ' + pp.Apellido AS Cliente_Nombre,
      c.Nit_ci_facturacion AS Cliente_NIT,
      pu.Nombre + ' ' + pu.Apellido AS Cajero_Nombre,
      vc.Metodo_pago,
      vc.Estado,
      vc.Total_bruto,
      vc.Total_descuento,
      vc.Total_neto
    FROM Ventas.Venta_Cabecera vc
    INNER JOIN Persona.Cliente c ON vc.id_cliente = c.id_cliente
    INNER JOIN Persona.Persona pp ON c.id_persona = pp.id_persona
    INNER JOIN Seguridad.Usuario u ON vc.id_usuario = u.id_usuario
    INNER JOIN Persona.Persona pu ON u.id_persona = pu.id_persona
    INNER JOIN Configuracion.Sede s ON vc.id_sede = s.id_sede
    WHERE s.Es_Central = 1
      AND CAST(vc.Fecha_emision AS DATE) = CAST(GETDATE() AS DATE)
    ORDER BY vc.Fecha_emision DESC`,
  empleadosLinked: `SELECT * FROM Persona.vw_Empleados_Global_TiempoReal ORDER BY Sede, Nombre_completo`,
  empleadosCentral: `SELECT
      s.Nombre AS Sede,
      p.id_sede,
      e.id_empleado,
      p.Nombre + ' ' + p.Apellido AS Nombre_completo,
      p.CI,
      p.Telefono,
      p.Email,
      p.Direccion,
      e.Fecha_contratacion,
      e.Salario_base
    FROM Persona.Empleado e
    INNER JOIN Persona.Persona p ON e.id_persona = p.id_persona
    INNER JOIN Configuracion.Sede s ON p.id_sede = s.id_sede
    WHERE s.Es_Central = 1
    ORDER BY Nombre_completo`,
  clientesLinked: `SELECT * FROM Persona.vw_Clientes_Global_TiempoReal ORDER BY Sede, Nombre_completo`,
  clientesCentral: `SELECT
      s.Nombre AS Sede,
      p.id_sede,
      c.id_cliente,
      p.Nombre + ' ' + p.Apellido AS Nombre_completo,
      p.CI,
      p.Telefono,
      p.Email,
      p.Direccion,
      c.Nit_ci_facturacion
    FROM Persona.Cliente c
    INNER JOIN Persona.Persona p ON c.id_persona = p.id_persona
    INNER JOIN Configuracion.Sede s ON p.id_sede = s.id_sede
    WHERE s.Es_Central = 1
    ORDER BY Nombre_completo`,
  stockLinked: `SELECT * FROM Inventario.vw_Stock_Sede_TiempoReal ORDER BY Sede, Producto`,
  stockCentral: `SELECT
      s.Nombre AS Sede,
      sa.id_sede,
      p.id_producto,
      p.Nombre AS Producto,
      p.Marca,
      p.Talla,
      p.Color,
      sa.Cantidad AS Cantidad_Disponible,
      CASE
        WHEN sa.Cantidad = 0 THEN 'Agotado'
        WHEN sa.Cantidad <= 5 THEN 'Critico'
        WHEN sa.Cantidad <= 10 THEN 'Bajo'
        ELSE 'Optimo'
      END AS Nivel_Stock
    FROM Inventario.Stock_Actual sa
    INNER JOIN Producto.Producto p ON sa.id_producto = p.id_producto
    INNER JOIN Configuracion.Sede s ON sa.id_sede = s.id_sede
    WHERE s.Es_Central = 1
    ORDER BY s.Nombre, p.Nombre`,
} as const

// Ventas Hoy: Central + Sede via OPENQUERY (el JOIN se resuelve en Sede).
// Se hacen dos queries separadas y se unen en JS para evitar que el
// optimizador local pague el costo de cruzar red por cada JOIN.
async function fetchVentasViaOpenquery(soloHoy: boolean, topN: number): Promise<RedTiempoRealBlock> {
  const filtroFecha = soloHoy
    ? "AND CAST(vc.Fecha_emision AS DATE) = CAST(GETDATE() AS DATE)"
    : ""

  // Nombres con TiendaRopa.* para que OPENQUERY funcione sin importar
  // el default database del login en Sede (a veces es master).
  const queryCentral = `
    SELECT TOP ${topN}
        ''Central'' AS Sede,
        vc.id_venta, vc.Nro_factura, vc.Fecha_emision, vc.Estado,
        pp.Nombre + '' '' + pp.Apellido AS Cliente_Nombre,
        c.Nit_ci_facturacion AS Cliente_NIT,
        pu.Nombre + '' '' + pu.Apellido AS Cajero_Nombre,
        vc.Metodo_pago, vc.Total_bruto, vc.Total_descuento, vc.Total_neto
    FROM TiendaRopa.Ventas.Venta_Cabecera vc
    INNER JOIN TiendaRopa.Persona.Cliente c  ON vc.id_cliente = c.id_cliente
    INNER JOIN TiendaRopa.Persona.Persona pp ON c.id_persona  = pp.id_persona
    INNER JOIN TiendaRopa.Seguridad.Usuario u ON vc.id_usuario = u.id_usuario
    INNER JOIN TiendaRopa.Persona.Persona pu ON u.id_persona  = pu.id_persona
    WHERE vc.Estado <> ''Borrador'' ${filtroFecha}
    ORDER BY vc.Fecha_emision DESC
  `.replace(/\s+/g, " ").trim()

  // Central: directo. Sede: via OPENQUERY (texto pasado al remoto).
  const sqlCentral = queryCentral.replace(/''/g, "'")
  const sqlSede = `SELECT * FROM OPENQUERY(SEDE, '${queryCentral.replace(/''Central''/g, "''Sede''")}')`

  const [centralRes, sedeRes] = await Promise.allSettled([
    queryRows(sqlCentral),
    queryRows(sqlSede),
  ])

  const central = centralRes.status === "fulfilled" ? centralRes.value : []
  const sede = sedeRes.status === "fulfilled" ? sedeRes.value : []
  const linkedErr = sedeRes.status === "rejected" ? getSqlErrorMessage(sedeRes.reason) : null

  const rows = [...central, ...sede].sort((a, b) => {
    const fa = new Date(a.Fecha_emision as string).getTime()
    const fb = new Date(b.Fecha_emision as string).getTime()
    return fb - fa
  })

  return {
    rows,
    error: centralRes.status === "rejected" && sedeRes.status === "rejected"
      ? "Central y Sede sin respuesta"
      : null,
    warning: linkedErr ? "Solo Central. Linked server no disponible." : null,
    linkedError: linkedErr,
    source: linkedErr ? "local" : "linked",
  }
}

export async function getRedVentasHoyGlobal(): Promise<RedTiempoRealBlock> {
  return fetchVentasViaOpenquery(true, 200)
}

export async function getRedEmpleadosGlobal(): Promise<RedTiempoRealBlock> {
  return loadLinkedOrCentral(
    SQL.empleadosLinked,
    SQL.empleadosCentral
  )
}

export async function getRedClientesGlobal(): Promise<RedTiempoRealBlock> {
  return loadLinkedOrCentral(
    SQL.clientesLinked,
    SQL.clientesCentral
  )
}

export async function getRedStockSedeTiempoReal(): Promise<RedTiempoRealBlock> {
  return loadLinkedOrCentral(
    SQL.stockLinked,
    SQL.stockCentral
  )
}

export async function getRedVentasGlobal(): Promise<RedTiempoRealBlock> {
  return fetchVentasViaOpenquery(false, 100)
}

export async function getRedVentasDetalleGlobal(
  idVenta: number,
  sede: string
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const pool = await getDbPool()
  try {
    const result = await pool
      .request()
      .input("idVenta", idVenta)
      .input("sede", sede)
      .query(
        `SELECT * FROM Ventas.vw_Ventas_Detalle_Global
         WHERE id_venta = @idVenta AND Sede = @sede`
      )
    return { rows: result.recordset as Record<string, unknown>[], error: null }
  } catch (err) {
    return { rows: [], error: getSqlErrorMessage(err) }
  }
}