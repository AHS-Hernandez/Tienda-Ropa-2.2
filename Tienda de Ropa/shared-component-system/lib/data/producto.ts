import { getDbPool, sql } from "@/lib/db"
import { queryRows } from "@/lib/db/query"

export async function registrarProducto(params: {
  idSubcategoria: number
  nombre: string
  descripcion: string
  marca: string
  color: string
  talla: string
  precioCosto: number
  precioVenta: number
}) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_subcategoria", sql.Int, params.idSubcategoria)
    .input("Nombre", sql.NVarChar(100), params.nombre)
    .input("Descripcion", sql.NVarChar(sql.MAX), params.descripcion)
    .input("Marca", sql.NVarChar(100), params.marca)
    .input("Color", sql.NVarChar(50), params.color)
    .input("Talla", sql.NVarChar(50), params.talla)
    .input("Precio_costo", sql.Decimal(10, 2), params.precioCosto)
    .input("Precio_venta", sql.Decimal(10, 2), params.precioVenta)
    .execute("Producto.sp_Registrar_Producto")
}

export async function modificarFichaProducto(params: {
  idProducto: number
  nombre?: string
  descripcion?: string
  marca?: string
  color?: string
  talla?: string
}) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_producto", sql.Int, params.idProducto)
    .input("Nombre", sql.NVarChar(100), params.nombre ?? null)
    .input("Descripcion", sql.NVarChar(sql.MAX), params.descripcion ?? null)
    .input("Marca", sql.NVarChar(100), params.marca ?? null)
    .input("Color", sql.NVarChar(50), params.color ?? null)
    .input("Talla", sql.NVarChar(50), params.talla ?? null)
    .execute("Producto.sp_Modificar_Ficha_Producto")
}

export async function actualizarPrecios(params: {
  idProducto: number
  precioCosto: number
  precioVenta: number
}) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_producto", sql.Int, params.idProducto)
    .input("Precio_costo", sql.Decimal(10, 2), params.precioCosto)
    .input("Precio_venta", sql.Decimal(10, 2), params.precioVenta)
    .execute("Producto.sp_Actualizar_Precios_Producto")
}

export async function getSubcategorias() {
  return queryRows(
    `SELECT id_subcategoria, Nombre, id_categoria, Categoria
     FROM Producto.vw_Listado_Subcategorias ORDER BY Categoria, Nombre`
  )
}

/** Búsqueda para compras/ajustes (tabla Producto — owner tiene GRANT directo). */
export async function buscarProductosCompra(
  texto: string,
  limite = 30
): Promise<
  {
    id_producto: number
    nombre: string
    marca: string | null
    talla: string | null
    color: string | null
    precio_costo: number
    precio_venta: number
    subcategoria: string
    categoria: string
  }[]
> {
  const q = texto.trim()
  if (!q) return []

  const rows = await queryRows<Record<string, unknown>>(
    `SELECT
      p.id_producto,
      p.Nombre AS nombre,
      p.Marca AS marca,
      p.Talla AS talla,
      p.Color AS color,
      p.Precio_costo AS precio_costo,
      p.Precio_venta AS precio_venta,
      sc.Nombre AS subcategoria,
      c.Nombre AS categoria
    FROM Producto.Producto p
    INNER JOIN Producto.Subcategoria sc ON p.id_subcategoria = sc.id_subcategoria
    INNER JOIN Producto.Categoria c ON sc.id_categoria = c.id_categoria
    WHERE
      p.Nombre LIKE @busqueda
      OR p.Marca LIKE @busqueda
      OR p.Color LIKE @busqueda
      OR sc.Nombre LIKE @busqueda
      OR c.Nombre LIKE @busqueda
      OR CAST(p.id_producto AS NVARCHAR(20)) = @exacto
    ORDER BY p.Nombre`,
    { busqueda: `%${q}%`, exacto: q }
  )

  return rows.slice(0, limite).map((r) => ({
    id_producto: Number(r.id_producto),
    nombre: String(r.nombre),
    marca: r.marca != null ? String(r.marca) : null,
    talla: r.talla != null ? String(r.talla) : null,
    color: r.color != null ? String(r.color) : null,
    precio_costo: Number(r.precio_costo),
    precio_venta: Number(r.precio_venta),
    subcategoria: String(r.subcategoria),
    categoria: String(r.categoria),
  }))
}
