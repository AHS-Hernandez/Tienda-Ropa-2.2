# Inventario y linked server — guía (tú = Central .230)

## ¿Qué hace el linked server?

**Solo lectura / reportes.** Une en una vista el stock (y ventas, clientes…) de:

- Tu servidor **Central** (datos locales, sede “Central”)
- El servidor **Sede** `10.224.111.77` (datos remotos vía `SEDE`)

No “copia” inventario solo por estar conectado. Para **mover** mercadería usas compras, transferencia o ajustes (abajo).

---

## Flujo recomendado (Central → Sede)

### 1) Ver inventario unificado (reporte)

1. Entra como **owner@test.com**.
2. Menú **Stock global** → pestaña **Reporte consolidado**.
3. Ahí ves filas `Central` + `Sede` (vista `Inventario.vw_Stock_Sede_TiempoReal` con linked server).

También: **Alertas** (stock bajo/agotado).

### 2) Entrar mercadería a Central (compras)

1. **Compras** → pestaña **Nueva orden**.
2. Elija **proveedor** (lista desplegable).
3. **Busque el producto** (nombre, marca o ID) y pulse el resultado.
4. Cantidad y costo → **Emitir orden**.
5. En **Órdenes**, en la fila **Pendiente** → **Recibir mercadería**.

SP: `sp_Emitir_Orden_Compra` → `sp_Consolidar_Recepcion_Mercaderia`  
Eso sube stock en la sede **Central** (`Es_Central = 1`).

### 3) Pasar stock de Central a Sede (en tu BD Central)

1. **Stock global** → pestaña **Transferir a sede**.
2. Busque producto (debe haber stock en **origen**, normalmente Central).
3. Origen = **Central**, Destino = **Sede**, cantidad → **Transferir**.

SP: `Inventario.sp_Transferir_Stock` (resta origen, suma destino en `Stock_Actual` / Kardex de **esta** base en .230).

**Importante:** El servidor físico **.77** tiene su **propia** base `TiendaRopa`. La transferencia en Central actualiza filas de configuración (sede 2) en Central; el reporte linked **lee** el stock real de .77. Si en .77 no hay filas de stock, allá seguirá en 0 hasta que en la sede hagan recepción/ajuste local o ustedes repliquen proceso en ese servidor.

Resumen práctico:

| Objetivo | Dónde en la app | SP |
|----------|-----------------|-----|
| Ver todo | Stock global → Consolidado | Vistas + linked |
| Comprar a proveedor | Compras → Recibir | `sp_Consolidar_Recepcion_Mercaderia` |
| Mover entre sedes (lógico en Central) | Stock global → Transferir | `sp_Transferir_Stock` |
| Ajuste en una sede | Admin sede → Inventario | `sp_Ejecutar_Ajuste_Inventario` |

---

## Linked server (ya conectado)

Si ya ejecutaste vistas y `sp_testlinkedserver` OK, no repitas salvo error.

| Paso | Servidor | Archivo |
|------|----------|---------|
| Login remoto | **Sede .77** | `SQL-Sede-Login-LinkedServer.sql` (usa `master` solo para `CREATE LOGIN`) |
| Crear enlace | **Central .230** | `SQL-Fix-LinkedServer-SSL.sql` (en `master`) |
| Vistas | **Central .230** | `Views Linked Server.sql` (en `TiendaRopa`) |

---

## Carrito (si aún falla)

En **TiendaRopa** en Central:

1. `SQL-Fix-Venta-Trigger-Sede.sql`
2. `SQL-Fix-Stock-Venta.sql`

Luego reiniciar `next dev`.
