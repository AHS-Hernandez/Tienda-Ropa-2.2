# Guía rápida — La Santa Cruz ERP

## Cuentas de prueba (`Datos prueba.sql`)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| owner@test.com | Abc123! | Dueño (nivel 4) |
| admin@test.com | Abc123! | Admin sede (nivel 3) |
| vendedor@test.com | Abc123! | Vendedor (nivel 2) |
| cliente@test.com | Abc123! | Cliente (nivel 1) |

Login: http://localhost:3000/auth/login?logout=1

---

## Cliente — comprar en línea

1. Entrar como **cliente@test.com**.
2. **Catálogo** → botón **Agregar** (solo productos con stock > 0).
3. **Carrito** → revisar líneas → **Procesar pago**.
4. **Mis pedidos** → ventas completadas.

SPs: `sp_Crear_Venta_Borrador` → `sp_Agregar_Producto_Venta` → `sp_Procesar_Cobro_Venta`.

---

## Vendedor — POS (caja)

1. Entrar como **vendedor@test.com** (o admin).
2. **POS** → buscar cliente (`fn_Buscar_Cliente`) → seleccionar.
3. Agregar productos del catálogo lateral.
4. Elegir método de pago → **Cobrar**.

Mismos SPs que el carrito del cliente.

---

## Inventario — cómo sube el stock

1. **Compras** (dueño): buscar producto en **Nueva orden** → `sp_Emitir_Orden_Compra` → **Pendiente**.
2. **Recibir mercadería**: `sp_Consolidar_Recepcion_Mercaderia` → stock en **Central**.
3. **Transferir a sucursal** (dueño): Stock global → Transferir → `sp_Transferir_Stock`.
4. **Reporte Central + Sede**: Stock global → Consolidado (linked server, solo lectura).
5. **Ajuste manual** (admin sede): Inventario → buscar producto → `sp_Ejecutar_Ajuste_Inventario`.

Detalle linked server: `SQL/PASOS-LINKED-SERVER.md`

---

## Marketing — promoción con alcance

Al crear campaña debe elegir **una** opción:

- Un **producto**
- Toda una **categoría**
- Una **subcategoría**

`sp_Asignar_Alcance_Promocion` (obligatorio tras `sp_Registrar_Campana`).

---

## SQL recomendado si el carrito falla

Ejecutar en SSMS:

1. `SQL/SQL-Fix-Bitacora.sql`
2. `SQL/SQL-Fix-Stock-Venta.sql`
3. Verificar usuario cliente vinculado a `Persona.Cliente` (mismo `id_persona` que `Seguridad.Usuario`).
