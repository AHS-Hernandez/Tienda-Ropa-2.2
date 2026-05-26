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

const PROXY_HINT =
  "Lectura vía procedimiento proxy (dbo). Para Central+Sede confirme linked server."

async function execRedSp(
  procedureName: string
): Promise<Record<string, unknown>[]> {
  const pool = await getDbPool()
  const result = await pool.request().execute(procedureName)
  return (result.recordset ?? []) as Record<string, unknown>[]
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
        warning:
          "Solo Central. Ejecute SQL-SP-Red-Global-Proxy.sql en TiendaRopa.",
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

async function loadViaProxy(
  procedureName: string,
  linkedSql: string,
  centralSql: string
): Promise<RedTiempoRealBlock> {
  try {
    const rows = await execRedSp(procedureName)
    const hasSede = rows.some((r) => {
      const sede = String(r.Sede ?? "").toLowerCase()
      return sede !== "central" && sede !== ""
    })
    return {
      rows,
      error: null,
      warning: hasSede ? null : PROXY_HINT,
      linkedError: null,
      source: "proxy",
    }
  } catch (proxyErr) {
    return loadLinkedOrCentral(
      linkedSql,
      centralSql,
      getSqlErrorMessage(proxyErr)
    )
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

export async function getRedVentasHoyGlobal(): Promise<RedTiempoRealBlock> {
  return loadViaProxy(
    "Configuracion.sp_Red_Ventas_Hoy_Global",
    SQL.ventasLinked,
    SQL.ventasCentral
  )
}

export async function getRedEmpleadosGlobal(): Promise<RedTiempoRealBlock> {
  return loadViaProxy(
    "Configuracion.sp_Red_Empleados_Global",
    SQL.empleadosLinked,
    SQL.empleadosCentral
  )
}

export async function getRedClientesGlobal(): Promise<RedTiempoRealBlock> {
  return loadViaProxy(
    "Configuracion.sp_Red_Clientes_Global",
    SQL.clientesLinked,
    SQL.clientesCentral
  )
}

export async function getRedStockSedeTiempoReal(): Promise<RedTiempoRealBlock> {
  return loadViaProxy(
    "Configuracion.sp_Red_Stock_Sede_TiempoReal",
    SQL.stockLinked,
    SQL.stockCentral
  )
}
