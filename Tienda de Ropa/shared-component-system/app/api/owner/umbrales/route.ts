import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { getDbPool, sql } from "@/lib/db"
import { queryRows } from "@/lib/db/query"
import { sanitizeRows } from "@/lib/api/sanitize-rows"

async function getUmbrales() {
  return queryRows(
    `SELECT u.id_subcategoria, MIN(u.Stock_minimo) AS Stock_minimo,
            sub.Nombre AS subcategoria, c.Nombre AS categoria
     FROM Inventario.Stock_Umbral u
     JOIN Producto.Subcategoria sub ON sub.id_subcategoria = u.id_subcategoria
     JOIN Producto.Categoria    c   ON c.id_categoria      = sub.id_categoria
     GROUP BY u.id_subcategoria, sub.Nombre, c.Nombre
     ORDER BY c.Nombre, sub.Nombre`
  )
}

async function getAlertasActuales() {
  try {
    return queryRows(
      `SELECT id_sede, id_producto, producto, subcategoria, stock_actual, umbral
       FROM Inventario.vw_Stock_Bajo
       ORDER BY stock_actual ASC`
    )
  } catch {
    return []
  }
}

async function getSubcategorias() {
  return queryRows(
    `SELECT sc.id_subcategoria, sc.Nombre AS subcategoria, c.Nombre AS categoria
     FROM Producto.Subcategoria sc
     JOIN Producto.Categoria c ON c.id_categoria = sc.id_categoria
     ORDER BY c.Nombre, sc.Nombre`
  )
}

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)

  try {
    if (searchParams.get("alertas") === "1") {
      const alertas = await getAlertasActuales()
      return NextResponse.json({ ok: true, alertas: sanitizeRows(alertas) })
    }
    if (searchParams.get("subcategorias") === "1") {
      const subcategorias = await getSubcategorias()
      return NextResponse.json({ ok: true, subcategorias: sanitizeRows(subcategorias) })
    }
    const umbrales = await getUmbrales()
    return NextResponse.json({ ok: true, umbrales: sanitizeRows(umbrales) })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const idSubcategoria = Number(body.id_subcategoria)
    const stockMinimo = Number(body.stock_minimo)

    if (!idSubcategoria || isNaN(stockMinimo) || stockMinimo < 0) {
      return NextResponse.json({ ok: false, message: "Datos inválidos" }, { status: 400 })
    }

    const pool = await getDbPool()

    // Obtener todas las sedes activas
    const sedesResult = await pool.request().query<{ id_sede: number }>(
      `SELECT id_sede FROM Configuracion.Sede WHERE Activa = 1`
    )

    // Aplicar el mismo umbral a todas las sedes
    for (const { id_sede } of sedesResult.recordset) {
      await pool.request()
        .input("id_subcategoria", sql.Int, idSubcategoria)
        .input("id_sede", sql.Int, id_sede)
        .input("Stock_minimo", sql.Int, stockMinimo)
        .query(`
          IF EXISTS (SELECT 1 FROM Inventario.Stock_Umbral WHERE id_subcategoria = @id_subcategoria AND id_sede = @id_sede)
            UPDATE Inventario.Stock_Umbral SET Stock_minimo = @Stock_minimo
            WHERE id_subcategoria = @id_subcategoria AND id_sede = @id_sede
          ELSE
            INSERT INTO Inventario.Stock_Umbral (id_subcategoria, id_sede, Stock_minimo)
            VALUES (@id_subcategoria, @id_sede, @Stock_minimo)
        `)
    }

    return NextResponse.json({ ok: true, message: "Umbral guardado para todas las sedes" })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const { id_subcategoria } = await request.json()
    if (!id_subcategoria) {
      return NextResponse.json({ ok: false, message: "id_subcategoria requerido" }, { status: 400 })
    }

    const pool = await getDbPool()
    await pool.request()
      .input("id_subcategoria", sql.Int, Number(id_subcategoria))
      .query(`DELETE FROM Inventario.Stock_Umbral WHERE id_subcategoria = @id_subcategoria`)

    return NextResponse.json({ ok: true, message: "Umbral eliminado" })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}
