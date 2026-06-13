# TiendaRopa — Sistema ERP Distribuido

**Plataforma de gestión integral para una cadena de tiendas de ropa con presencia en múltiples sedes, construida sobre arquitectura híbrida SQL Server + MongoDB.**

---

## Presentación de la plataforma

TiendaRopa es un sistema ERP en línea que unifica la operación de **Central** y **Sede** en un único entorno de trabajo. La aplicación web, desarrollada en **Next.js 15** sobre **React 19**, ofrece interfaces diferenciadas por rol (Dueño, Administrador de Sede, Vendedor y Cliente), cada una con acceso únicamente a la información que su nivel de responsabilidad exige.

Desde el punto de vista del negocio, el sistema resuelve cuatro problemas operativos típicos de una cadena de retail:

1. **Fragmentación geográfica del inventario** — cada sucursal conoce su stock local en tiempo real, mientras que Central observa la red completa mediante *linked server*.
2. **Replicación selectiva de catálogo y promociones** — el catálogo maestro y las campañas de marketing se mantienen en Central y se propagan automáticamente a las sucursales por medio de una cola asincrónica.
3. **Trazabilidad y control** — toda operación crítica queda registrada en bitácoras y kardex, con vistas globales para auditoría.
4. **Experiencia diferenciada por rol** — el dueño accede a métricas consolidadas; el administrador de sede gestiona inventario y empleados de su sucursal; el vendedor opera el punto de venta; el cliente compra, reseña y recibe recomendaciones personalizadas.

El componente NoSQL (MongoDB) actúa como **capa de enriquecimiento**: gestiona las reseñas de productos con prueba de compra, registra los eventos de comportamiento del cliente en colecciones *time-series*, y materializa un feed personalizado por usuario con vigencia controlada por TTL.

---

## Estructura de la documentación

| Capítulo | Contenido | Puntaje de rúbrica |
| --- | --- | --- |
| [01 — Modelado lógico y físico](./01-modelado.md) | Diagrama relacional, normalización 3FN, claves y fragmentación horizontal por sede. | 30 |
| [02 — Implementación SQL](./02-implementacion-sql.md) | Tablas, procedimientos almacenados, triggers, vistas y modelo de permisos por nivel. | 15 |
| [03 — Optimización y rendimiento](./03-optimizacion-rendimiento.md) | Índices justificados, reescritura de consultas y análisis de plan de ejecución. | 30 |
| [04 — Transacciones y concurrencia](./04-transacciones-concurrencia.md) | Manejo de aislamiento, control de duplicados y prevención de bloqueos. | 25 |
| [05 — Módulo NoSQL (MongoDB)](./05-modulo-nosql.md) | Reseñas con validación de esquema, time-series y feed materializado. | 50 |
| [06 — Reglas de negocio](./06-reglas-negocio.md) | Reglas duras del dominio que el sistema garantiza. | — |

**Subtotal documentado: 150 puntos sobre 200.** Los 50 restantes corresponden a la documentación técnica en sí (25) y a la presentación oral (25).

---

## Datos rápidos del sistema

| Aspecto | Detalle |
| --- | --- |
| Motor relacional | SQL Server con esquemas por dominio (`Persona`, `Seguridad`, `Producto`, `Ventas`, `Inventario`, `Compras`, `Marketing`, `Configuracion`) |
| Motor documental | MongoDB con tres colecciones (`resenas`, `eventos`, `feed_cliente`) |
| Fragmentación | Horizontal por `id_sede`, con réplica activa Central ↔ Sede |
| Replicación | Cola asincrónica `Configuracion.Cola_Replicacion` consumida por SQL Agent Job |
| Distribución | Linked Server `SEDE` para consultas en vivo entre nodos |
| Aplicación | Next.js 15 (App Router) + React 19 + Tailwind CSS 4 |
| Autenticación | JOSE (JWT) con cookies HTTP-only por rol |
| Cuatro roles | `admin-global`, `admin-sede`, `vendedor`, `cliente` |
