/** Filas de stock con nombres de columna fijos para la UI (evita desfase con vistas viejas). */
export function normalizeFilaStock(
  r: Record<string, unknown>
): Record<string, unknown> {
  const cantidad = Number(
    r.Cantidad ?? r.Cantidad_Disponible ?? r.cantidad ?? 0
  )
  let nivel = String(r.Nivel_Alerta ?? r.Nivel_Stock ?? "")
  if (!nivel) {
    if (cantidad === 0) nivel = "Agotado"
    else if (cantidad <= 5) nivel = "Crítico"
    else if (cantidad <= 10) nivel = "Bajo"
    else nivel = "Óptimo"
  }

  return {
    Sede: String(r.Sede ?? r.sede ?? "—"),
    id_producto: Number(r.id_producto ?? r.Id_producto ?? 0),
    Producto: String(r.Producto ?? r.Nombre ?? r.nombre ?? "—"),
    Marca: r.Marca != null ? String(r.Marca) : "",
    Talla: r.Talla != null ? String(r.Talla) : "",
    Color: r.Color != null ? String(r.Color) : "",
    Cantidad: cantidad,
    Nivel: nivel,
  }
}
