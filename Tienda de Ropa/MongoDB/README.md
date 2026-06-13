# Módulo NoSQL — TiendaRopa (MongoDB)

Módulo NoSQL del proyecto distribuido TiendaRopa. Implementa dos líneas de negocio
que el modelo relacional resuelve mal o no resuelve:

- **B — Reseñas y valoraciones** de productos (colección `resenas`).
- **C — Comportamiento web + feed personalizado** (colección time-series `eventos`
  + modelo materializado `feed_cliente`).

El catálogo de productos NO se modela aquí: ya está bien resuelto en SQL Server con
integridad referencial. Duplicarlo solo agregaría un problema de sincronización sin
beneficio. Esa omisión es una decisión de diseño, no un olvido.

## Orden de ejecución

Ejecutar en este orden con `mongosh`:

```bash
mongosh "mongodb://localhost:27017" 00_crear_bd.js
mongosh "mongodb://localhost:27017" 01_datos_referencia_sql.js
mongosh "mongodb://localhost:27017" 02_datos_mongo.js
mongosh "mongodb://localhost:27017" 03_consultas_resenas.js
mongosh "mongodb://localhost:27017" 04_consultas_eventos.js
mongosh "mongodb://localhost:27017" 05_generar_feed.js
mongosh "mongodb://localhost:27017" 06_consultas_feed.js
```

Base de datos: `tiendaropa_nosql`.

## ¿Es necesaria la conexión con SQL Server? — No en esta capa

A nivel de MongoDB **no existe ni debe existir** una conexión directa a SQL Server.
MongoDB no "habla" con SQL Server; son dos motores independientes. La integración
ocurre en la **capa de aplicación** (Next.js, etapa posterior), donde un mismo proceso
usa el driver `mssql` y el driver `mongodb` y coordina ambos.

Para que el módulo sea **autocontenido y demostrable sin SQL levantado**, los datos
que SQL posee (productos, clientes, ventas, stock) se representan aquí como
**colecciones de referencia** (`ref_productos`, `ref_clientes`, `ref_ventas`) en el
archivo `01_datos_referencia_sql.js`. Están marcadas explícitamente como *fixtures de
prueba*: en producción esos datos NO viven en Mongo, se consultan a SQL.

Esto deja la frontera nítida:
- Lo que es de SQL → `ref_*` (simulado para pruebas).
- Lo que es de Mongo → `resenas`, `eventos`, `feed_cliente` (propiedad real del módulo).

## Defensa de las decisiones de diseño

**1. ¿Por qué MongoDB y no más SQL?** Solo se llevó a Mongo lo que el relacional
resuelve mal: datos de esquema variable (reseñas con fotos/respuestas opcionales),
alto volumen append-only (eventos) y un modelo de lectura derivado (feed). Lo
transaccional (venta, stock, Kardex, usuarios, bitácora legal) se queda en SQL.

**2. ¿Por qué `eventos` es time-series?** Las consultas son por ventana temporal +
metadato (sede, tipo, producto). Las colecciones time-series nativas comprimen por esa
dimensión y abaratan justo ese patrón de acceso. Además se les fija `expireAfterSeconds`
para retención automática de datos crudos (90 días).

**3. ¿Por qué el feed es materializado y no calculado al vuelo?** Es el equivalente en
Mongo de `Inventario.Stock_Actual`: una vista materializada que un proceso mantiene a
partir de un log (allá Kardex, acá eventos). Lectura instantánea para el front a cambio
de frescura controlada — el mismo tradeoff frescura/latencia que ya se justificó con
los Linked Server. Un índice TTL sobre `vigencia` caduca el feed y fuerza su recálculo.

**4. ¿Por qué `embed` vs `referencia`?**
- Se *embeben* los datos que se leen siempre juntos y están acotados: `respuestas`
  dentro de la reseña, `recomendaciones` dentro del feed, `variantes`/`fotos`.
- Se *referencian* (se guarda solo la clave) las entidades que viven en SQL:
  `id_producto`, `id_cliente`, `id_venta`. SQL es siempre el system of record.
- Se *denormaliza con criterio* el dato de display (`nombre`, `precio`, `imagen`) como
  snapshot para evitar un round-trip al renderizar, aceptando staleness controlado.

**5. ¿Por qué reglas que cruzan Mongo y SQL?** Dos reglas atan el módulo al negocio:
solo reseña quien compró (valida contra ventas) y no se recomienda lo agotado o lo ya
comprado (valida contra stock/ventas). Esto se programa en la capa de aplicación; en
estos scripts se demuestra contra los fixtures `ref_*`.

**6. ¿Por qué el ángulo distribuido?** Se mantiene el mismo criterio que en SQL:
- `eventos` se fragmenta por `meta.id_sede` (igual que la fragmentación horizontal).
- El perfil de gustos del cliente es **global** (un cliente es la misma persona en
  ambas sedes — como en `vw_Clientes_Global_TiempoReal`), pero la **materialización**
  del feed respeta la sede del cliente para disponibilidad (stock local). Gustos
  globales, disponibilidad local.

## Cumplimiento de rúbrica (Módulo NoSQL, 50 pts)

- **Inserción de datos:** alta de reseñas y eventos (`02_datos_mongo.js`).
- **Estructuras adecuadas:** tres patrones distintos y justificados — time-series
  (`eventos`), embebido + referencia (`resenas`), modelo materializado con índice TTL
  (`feed_cliente`).
- **Consultas relevantes:** agregaciones de valoración y distribución de estrellas
  (`03`), comportamiento por sede / búsquedas fallidas / embudo (`04`), y el feed por
  señales con co-visitación (`05`/`06`).
