# 05 — Módulo NoSQL (MongoDB)

## Rol del componente NoSQL

MongoDB cumple una función deliberada y específica: **almacenar y procesar la información que no encaja bien en el modelo relacional** y que justifica la inversión en un segundo motor. El sistema de récord sigue siendo SQL Server (clientes, ventas, stock); MongoDB es la **capa de enriquecimiento de la experiencia del cliente**.

Tres colecciones, tres razones distintas para elegir Mongo:

1. **`resenas`** — documentos con embebido (respuestas) + referencias a SQL (cliente, producto, venta), con validación de esquema a nivel de motor.
2. **`eventos`** — colección **time-series** para el log de comportamiento del cliente con TTL automático.
3. **`feed_cliente`** — modelo de lectura **materializado** y caducable, recalculado desde los eventos.

Toda la implementación vive en `MongoDB/00_crear_bd.js` a `MongoDB/06_consultas_feed.js`. La base se llama `tiendaropa_nosql`.

## Colección `resenas`

### Estructura

Cada reseña es un documento autocontenido que combina:

- **Referencias a SQL**: `id_producto`, `id_cliente`, `id_venta`, `id_sede`. Estos campos son la prueba documental de compra; sin venta válida en SQL la reseña no puede insertarse desde la aplicación.
- **Datos propios**: `rating` (1 a 5), `titulo`, `texto`, `fotos[]`, `votos_util`, `estado` (`publicada` / `oculta`), `fecha`.
- **Subdocumentos embebidos**: `respuestas[]`, donde el vendedor o el administrador responde la reseña sin necesidad de otra colección.

### Validación por `$jsonSchema`

La colección declara un validador estricto:

```javascript
validator: {
  $jsonSchema: {
    bsonType: "object",
    required: ["id_producto", "id_cliente", "id_venta", "id_sede",
               "rating", "fecha", "estado"],
    properties: {
      rating: { bsonType: "number", minimum: 1, maximum: 5 },
      estado: { enum: ["publicada", "oculta"] }
    }
  }
},
validationLevel: "strict",
validationAction: "error"
```

El motor rechaza cualquier inserción que viole estas invariantes (rating fuera de rango, estado no permitido, referencias faltantes). La aplicación queda libre de duplicar la validación.

### Índices

| Índice | Propósito |
| --- | --- |
| `{id_cliente:1, id_producto:1, id_venta:1}` único | Una opinión por compra. Imposible reseñar dos veces la misma venta. |
| `{id_producto:1, estado:1, fecha:-1}` | Reseñas publicadas de un producto, más recientes primero. La consulta más común. |
| `{id_producto:1, rating:1}` | Soporta agregaciones de promedio y distribución. |

### Consultas representativas

| Consulta | Operación | Razón de negocio |
| --- | --- | --- |
| Reseñas publicadas de un producto, recientes primero | `find` + `sort` | Ficha de producto |
| Promedio y total por producto | `aggregate` con `$group` + `$avg` | Rating exhibido junto al precio |
| Histograma de estrellas | `aggregate` con `$group` por valor de rating | Resumen visual de la reseña |
| Top productos mejor valorados (≥ N reseñas) | `aggregate` + `$match` de mínimo | Evita que un producto con 1 reseña perfecta domine |
| Comentarios moderados (ocultos) | `find` + filtro de estado | Bandeja del administrador |

Todas las consultas están en `MongoDB/03_consultas_resenas.js`.

## Colección `eventos` (time-series)

### Por qué time-series

Los eventos de comportamiento (vista de producto, búsqueda, agregado al carrito, abandono) **siempre se consultan por ventana de tiempo + dimensión** (sede, producto, tipo). MongoDB time-series está diseñado exactamente para ese patrón: agrupa físicamente los documentos por `metaField + timeField` y aplica compresión. El resultado es escritura masiva eficiente y agregaciones temporales rápidas.

### Configuración

```javascript
db.createCollection("eventos", {
  timeseries: {
    timeField: "ts",
    metaField: "meta",     // { id_sede, tipo, id_producto }
    granularity: "seconds"
  },
  expireAfterSeconds: 7776000   // 90 días de retención automática
});
```

El TTL borra el dato crudo a los 90 días, manteniendo la colección acotada. La intención de negocio (las métricas derivadas) sobrevive en `feed_cliente` y en agregaciones materializadas.

### Consultas representativas

| Consulta | Negocio |
| --- | --- |
| Productos más vistos por sede en 7 días | Señal de tendencia local para el feed |
| Búsquedas sin resultados | Qué quiere el cliente y no encontramos |
| Embudo: vista → carrito → abandono | Salud del POS web |
| Eventos por hora del día | Curva de uso para planificar promociones |

Implementación en `MongoDB/04_consultas_eventos.js`.

## Colección `feed_cliente` (materializada con TTL)

### Modelo

El feed es el equivalente NoSQL de `Stock_Actual` en SQL: una vista materializada que la aplicación lee sin computar nada en el momento. Cada documento agrupa:

- `id_cliente` — clave única.
- `id_sede_contexto` — sede usada para verificar disponibilidad real del producto.
- `generado`, `vigencia` — control temporal.
- `perfil` — características del cliente derivadas del histórico.
- `recomendaciones[]` — array de productos con `score`, `fuente` (algoritmo que lo recomendó) y `motivo` (texto legible).

### TTL e índices

```javascript
db.feed_cliente.createIndex({ id_cliente: 1 }, { unique: true });
db.feed_cliente.createIndex({ vigencia: 1 }, { expireAfterSeconds: 0 });
```

El índice TTL con `expireAfterSeconds: 0` borra cada feed **en el momento exacto** en que `vigencia` queda en el pasado. La siguiente consulta del cliente activa la regeneración. Este patrón evita exhibir recomendaciones obsoletas sin necesidad de un job de limpieza separado.

### Generación

El script `MongoDB/05_generar_feed.js` materializa los feeds a partir de:

- El histórico de ventas del cliente (consultado en SQL vía la capa de aplicación).
- Los eventos recientes (`eventos`) de su sede y sus sesiones.
- Las promociones vigentes y el stock local.

El resultado es un documento por cliente listo para servirse en una sola lectura.

## Interfaz con SQL desde la aplicación

La capa de datos en `shared-component-system/lib/data/resenas.ts`, `eventos.ts` y `feed.ts`:

- **Verifica en SQL** que la venta exista y pertenezca al cliente antes de aceptar la reseña.
- **Enriquece** la reseña con el nombre del cliente (vía `getNombresClientes`) y el nombre del producto (vía `getNombresProductos`) al servir la respuesta al frontend. Mongo guarda solo las referencias numéricas; el nombre se resuelve en el momento, evitando que la reseña quede desincronizada si el cliente cambia su nombre.
- **Encola eventos** desde el hook `useTrackEvent` cada vez que el cliente interactúa con la UI (ver producto, buscar, agregar al carrito).

## Resumen del aporte de NoSQL

| Característica | Aporte concreto |
| --- | --- |
| Validación `$jsonSchema` | Integridad sin código duplicado |
| Subdocumentos | Respuestas embebidas en la reseña sin join |
| Time-series | Log de comportamiento escalable con compresión nativa |
| TTL | Retención y caducidad automáticas, sin jobs de mantenimiento |
| Modelo materializado | Lectura constante O(1) del feed, recalculado bajo demanda |
| Índices compuestos | Una opinión por compra y ordenamiento por fecha en una sola pasada |
