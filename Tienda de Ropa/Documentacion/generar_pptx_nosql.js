// Presentacion del Modulo NoSQL — TiendaRopa
// Paleta Sage Calm + acentos berry
// Ejecutar: node generar_pptx_nosql.js

const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title  = "Modulo NoSQL — TiendaRopa";

// Paleta
const C = {
  bgDark:    "1F3B2D",  // forest oscuro (titulos)
  bgLight:   "FFFFFF",
  accent:    "6D2E46",  // berry — acento
  primary:   "2C5F2D",  // forest
  secondary: "84B59F",  // sage
  muted:     "97BC62",  // moss
  text:      "1F1F1F",
  textSoft:  "555555",
  card:      "F1F5F0",  // sage muy claro
  codeBg:    "0F1B14",
  codeFg:    "C9E4CA",
};

const F = {
  head: "Georgia",
  body: "Calibri",
  mono: "Consolas",
};

// ----------- helpers -----------
function pageNumber(slide, n, total) {
  slide.addText(`${n} / ${total}`, {
    x: 12.5, y: 7.15, w: 0.7, h: 0.25,
    fontFace: F.body, fontSize: 9, color: C.textSoft, align: "right",
  });
}

function brand(slide) {
  slide.addText("TiendaRopa  ·  Modulo NoSQL", {
    x: 0.5, y: 7.15, w: 6, h: 0.25,
    fontFace: F.body, fontSize: 9, color: C.textSoft,
  });
}

function dot(slide, x, y, color = C.primary) {
  slide.addShape(pres.ShapeType.ellipse, {
    x, y, w: 0.18, h: 0.18, fill: { color }, line: { color, width: 0 },
  });
}

function sectionBadge(slide, label) {
  slide.addText(label, {
    x: 0.5, y: 0.55, w: 4, h: 0.35,
    fontFace: F.body, fontSize: 11, bold: true, color: C.accent,
    charSpacing: 4,
  });
}

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.5, y: 0.95, w: 12.3, h: 0.9,
    fontFace: F.head, fontSize: opts.size || 36, bold: true,
    color: opts.color || C.primary,
  });
}

const TOTAL = 14;

// =====================================================================
// SLIDE 1 — PORTADA
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgDark };

  // motif: medio circulo lateral
  s.addShape(pres.ShapeType.ellipse, {
    x: 10.5, y: -3, w: 8, h: 13,
    fill: { color: C.primary }, line: { color: C.primary, width: 0 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: 11.5, y: -2, w: 6, h: 10,
    fill: { color: C.secondary }, line: { color: C.secondary, width: 0 },
  });

  s.addText("MODULO NOSQL", {
    x: 0.7, y: 1.6, w: 8, h: 0.5,
    fontFace: F.body, fontSize: 14, bold: true, color: C.muted, charSpacing: 8,
  });

  s.addText("TiendaRopa", {
    x: 0.7, y: 2.1, w: 10, h: 1.5,
    fontFace: F.head, fontSize: 64, bold: true, color: "FFFFFF",
  });

  s.addText("MongoDB como capa de enriquecimiento\nde la experiencia del cliente", {
    x: 0.7, y: 3.7, w: 9, h: 1.4,
    fontFace: F.head, italic: true, fontSize: 22, color: C.secondary,
  });

  // linea separadora (no debajo de titulo, sino como motif lateral)
  s.addShape(pres.ShapeType.rect, {
    x: 0.7, y: 5.5, w: 0.6, h: 0.06, fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });

  s.addText("Defensa tecnica  ·  Proyecto integrador  ·  Base de Datos II", {
    x: 0.7, y: 5.7, w: 9, h: 0.4,
    fontFace: F.body, fontSize: 13, color: "FFFFFF",
  });

  s.addText("3 colecciones  ·  $jsonSchema  ·  Time-series  ·  TTL  ·  Vista materializada", {
    x: 0.7, y: 6.1, w: 9, h: 0.4,
    fontFace: F.body, fontSize: 11, color: C.muted, charSpacing: 2,
  });
}

// =====================================================================
// SLIDE 2 — POR QUE DOS MOTORES
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "INTRODUCCION");
  title(s, "Por que dos motores y no uno");

  s.addText("SQL Server es el sistema de registro transaccional.\nMongoDB resuelve lo que el modelo relacional resuelve mal.", {
    x: 0.5, y: 1.85, w: 12, h: 0.9,
    fontFace: F.head, italic: true, fontSize: 17, color: C.textSoft,
  });

  // tres tarjetas
  const cards = [
    {
      n: "01",
      h: "Resenas con estructura variable",
      b: "Fotos opcionales, respuestas embebidas, votos. Modelado relacional implica 3 tablas y JOINs constantes para servir la ficha de producto.",
    },
    {
      n: "02",
      h: "Eventos de comportamiento",
      b: "Vistas, busquedas, agregados al carrito. Escritura masiva, lectura siempre por ventana de tiempo + dimension. Patron natural de time-series.",
    },
    {
      n: "03",
      h: "Feed personalizado",
      b: "Lectura O(1) construida a partir de varias senales. Debe caducar y regenerarse sin intervencion manual. Patron de vista materializada con TTL.",
    },
  ];

  const cardW = 3.95, cardH = 3.4, gap = 0.25;
  cards.forEach((c, i) => {
    const x = 0.5 + i * (cardW + gap);
    const y = 3.05;
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: cardW, h: cardH, rectRadius: 0.1,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.75 },
    });
    s.addText(c.n, {
      x: x + 0.3, y: y + 0.25, w: 1.5, h: 0.5,
      fontFace: F.head, fontSize: 26, bold: true, color: C.accent,
    });
    s.addText(c.h, {
      x: x + 0.3, y: y + 0.85, w: cardW - 0.6, h: 0.9,
      fontFace: F.head, fontSize: 16, bold: true, color: C.primary,
    });
    s.addText(c.b, {
      x: x + 0.3, y: y + 1.8, w: cardW - 0.6, h: cardH - 2,
      fontFace: F.body, fontSize: 12, color: C.text, valign: "top",
    });
  });

  brand(s); pageNumber(s, 2, TOTAL);
}

// =====================================================================
// SLIDE 3 — LO QUE SI O SI TOMA MONGO
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "ALCANCE");
  title(s, "Lo que MongoDB toma (y lo que NO)");

  // dos columnas: TOMA vs NO TOMA
  const colW = 5.95, colH = 4.6, y0 = 2.0;

  // columna izquierda — TOMA
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: y0, w: colW, h: colH, rectRadius: 0.1,
    fill: { color: C.primary }, line: { color: C.primary, width: 0 },
  });
  s.addText("LO QUE MONGO TOMA", {
    x: 0.8, y: y0 + 0.25, w: colW - 0.6, h: 0.45,
    fontFace: F.body, fontSize: 13, bold: true, color: C.muted, charSpacing: 5,
  });
  const toma = [
    ["resenas", "Opiniones de clientes con prueba de compra, respuestas y fotos."],
    ["eventos", "Log de comportamiento web (vistas, busquedas, carrito, abandono)."],
    ["feed_cliente", "Recomendaciones materializadas listas para servir al cliente."],
  ];
  toma.forEach((t, i) => {
    const y = y0 + 0.95 + i * 1.15;
    dot(s, 0.85, y + 0.12, C.muted);
    s.addText(t[0], {
      x: 1.15, y, w: colW - 0.85, h: 0.4,
      fontFace: F.head, fontSize: 17, bold: true, color: "FFFFFF",
    });
    s.addText(t[1], {
      x: 1.15, y: y + 0.4, w: colW - 0.85, h: 0.7,
      fontFace: F.body, fontSize: 12, color: C.secondary,
    });
  });

  // columna derecha — SE QUEDA EN SQL
  const x2 = 0.5 + colW + 0.4;
  s.addShape(pres.ShapeType.roundRect, {
    x: x2, y: y0, w: colW, h: colH, rectRadius: 0.1,
    fill: { color: C.card }, line: { color: C.secondary, width: 1 },
  });
  s.addText("SE QUEDA EN SQL SERVER", {
    x: x2 + 0.3, y: y0 + 0.25, w: colW - 0.6, h: 0.45,
    fontFace: F.body, fontSize: 13, bold: true, color: C.accent, charSpacing: 5,
  });
  const noToma = [
    ["Clientes y empleados", "Identidad, contacto, autenticacion."],
    ["Ventas y stock", "Cabecera, detalle, kardex, umbrales."],
    ["Catalogo y compras", "Productos, categorias, ordenes a proveedor."],
  ];
  noToma.forEach((t, i) => {
    const y = y0 + 0.95 + i * 1.15;
    dot(s, x2 + 0.35, y + 0.12, C.accent);
    s.addText(t[0], {
      x: x2 + 0.65, y, w: colW - 0.85, h: 0.4,
      fontFace: F.head, fontSize: 17, bold: true, color: C.primary,
    });
    s.addText(t[1], {
      x: x2 + 0.65, y: y + 0.4, w: colW - 0.85, h: 0.7,
      fontFace: F.body, fontSize: 12, color: C.text,
    });
  });

  s.addText("Mongo es capa de enriquecimiento, no reemplazo. La verdad transaccional vive en SQL.", {
    x: 0.5, y: 6.75, w: 12.3, h: 0.35,
    fontFace: F.head, italic: true, fontSize: 13, color: C.textSoft, align: "center",
  });

  brand(s); pageNumber(s, 3, TOTAL);
}

// =====================================================================
// SLIDE 4 — LAS 3 COLECCIONES (RESUMEN)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "ARQUITECTURA");
  title(s, "Tres colecciones, tres patrones");

  const items = [
    { tag: "MODULO B", h: "resenas", patron: "Documento con $jsonSchema, embebidos y referencias", color: C.primary },
    { tag: "MODULO C — capa 1", h: "eventos", patron: "Time-series con TTL automatico (90 dias)", color: C.accent },
    { tag: "MODULO C — capa 2", h: "feed_cliente", patron: "Vista materializada con TTL controlado por vigencia", color: C.muted },
  ];

  const rowH = 1.4, y0 = 2.2;
  items.forEach((it, i) => {
    const y = y0 + i * (rowH + 0.25);

    // banda de color izquierda (motif)
    s.addShape(pres.ShapeType.rect, {
      x: 0.5, y, w: 0.15, h: rowH,
      fill: { color: it.color }, line: { color: it.color, width: 0 },
    });

    s.addShape(pres.ShapeType.roundRect, {
      x: 0.65, y, w: 12.15, h: rowH, rectRadius: 0.08,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.5 },
    });

    s.addText(it.tag, {
      x: 1.0, y: y + 0.2, w: 4, h: 0.35,
      fontFace: F.body, fontSize: 10, bold: true, color: it.color, charSpacing: 4,
    });
    s.addText(it.h, {
      x: 1.0, y: y + 0.55, w: 4, h: 0.55,
      fontFace: F.mono, fontSize: 22, bold: true, color: C.text,
    });
    s.addText(it.patron, {
      x: 5.5, y: y + 0.45, w: 7.2, h: 0.7,
      fontFace: F.head, fontSize: 16, italic: true, color: C.textSoft, valign: "middle",
    });
  });

  brand(s); pageNumber(s, 4, TOTAL);
}

// =====================================================================
// SLIDE 5 — RESENAS (estructura)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "COLECCION 01  ·  resenas");
  title(s, "Documento con prueba de compra");

  // izquierda — descripcion
  s.addText("Por que un documento", {
    x: 0.5, y: 1.95, w: 6.2, h: 0.4,
    fontFace: F.head, fontSize: 18, bold: true, color: C.primary,
  });
  s.addText(
    "Una resena agrupa partes obligatorias (rating, fecha, referencias) y partes opcionales (fotos, respuestas, votos). " +
    "El modelo relacional exigiria 3 tablas y JOINs en cada lectura. " +
    "MongoDB la guarda como un objeto autocontenido que se sirve con una consulta.",
    {
      x: 0.5, y: 2.4, w: 6.2, h: 1.7,
      fontFace: F.body, fontSize: 13, color: C.text, valign: "top",
    });

  s.addText("Lo que SI se garantiza", {
    x: 0.5, y: 4.2, w: 6.2, h: 0.4,
    fontFace: F.head, fontSize: 18, bold: true, color: C.accent,
  });
  const garantias = [
    "rating entre 1 y 5 (validador del motor)",
    "estado en { publicada, oculta }",
    "referencias id_producto, id_cliente, id_venta, id_sede",
    "una resena por (cliente, producto, venta) — indice unico",
  ];
  garantias.forEach((g, i) => {
    const y = 4.7 + i * 0.42;
    dot(s, 0.55, y + 0.1, C.accent);
    s.addText(g, {
      x: 0.85, y, w: 5.9, h: 0.4,
      fontFace: F.body, fontSize: 12, color: C.text,
    });
  });

  // derecha — bloque de codigo
  s.addShape(pres.ShapeType.roundRect, {
    x: 7.0, y: 1.95, w: 5.8, h: 4.95, rectRadius: 0.1,
    fill: { color: C.codeBg }, line: { color: C.codeBg, width: 0 },
  });
  s.addText("DOCUMENTO TIPO", {
    x: 7.2, y: 2.05, w: 5.4, h: 0.35,
    fontFace: F.body, fontSize: 10, bold: true, color: C.secondary, charSpacing: 4,
  });
  const code = [
    "{",
    "  id_producto: 1001,",
    "  id_cliente:  4,",
    "  id_venta:    37,",
    "  id_sede:     1,",
    "  rating:      5,",
    "  titulo:      'Excelente calidad',",
    "  texto:       'La tela es muy buena...',",
    "  fotos:       ['url1', 'url2'],",
    "  estado:      'publicada',",
    "  fecha:       ISODate('2026-06-13'),",
    "  respuestas: [",
    "    { autor: 'tienda',",
    "      texto: 'Gracias por tu opinion',",
    "      fecha: ISODate('2026-06-14') }",
    "  ]",
    "}",
  ];
  s.addText(code.join("\n"), {
    x: 7.2, y: 2.45, w: 5.4, h: 4.4,
    fontFace: F.mono, fontSize: 11.5, color: C.codeFg, valign: "top",
  });

  brand(s); pageNumber(s, 5, TOTAL);
}

// =====================================================================
// SLIDE 6 — RESENAS (consultas + indices)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "COLECCION 01  ·  resenas");
  title(s, "Indices y consultas que mueven el negocio");

  // tabla de indices
  s.addText("Tres indices, cada uno con razon clara", {
    x: 0.5, y: 1.9, w: 12.3, h: 0.4,
    fontFace: F.head, fontSize: 17, italic: true, color: C.textSoft,
  });

  // filas
  const idx = [
    ["UNICO", "{id_cliente, id_producto, id_venta}",
     "Una opinion por compra. El motor rechaza el duplicado, no la aplicacion."],
    ["LECTURA", "{id_producto, estado, fecha desc}",
     "Resenas publicadas de un producto, recientes primero. La consulta mas frecuente."],
    ["AGREGACION", "{id_producto, rating}",
     "Promedio y distribucion de estrellas para la ficha de producto."],
  ];

  const rowH = 0.95, y0 = 2.55;
  idx.forEach((r, i) => {
    const y = y0 + i * (rowH + 0.18);
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.5, y, w: 12.3, h: rowH, rectRadius: 0.08,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.5 },
    });
    s.addShape(pres.ShapeType.rect, {
      x: 0.5, y, w: 1.6, h: rowH,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText(r[0], {
      x: 0.5, y, w: 1.6, h: rowH,
      fontFace: F.body, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", charSpacing: 3,
    });
    s.addText(r[1], {
      x: 2.3, y: y + 0.15, w: 10.4, h: 0.4,
      fontFace: F.mono, fontSize: 13, bold: true, color: C.text,
    });
    s.addText(r[2], {
      x: 2.3, y: y + 0.5, w: 10.4, h: 0.4,
      fontFace: F.body, fontSize: 11.5, color: C.textSoft,
    });
  });

  // pie — consulta estrella
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 5.95, w: 12.3, h: 1.0, rectRadius: 0.08,
    fill: { color: C.codeBg }, line: { color: C.codeBg, width: 0 },
  });
  s.addText("CONSULTA DE FICHA DE PRODUCTO", {
    x: 0.75, y: 6.05, w: 8, h: 0.3,
    fontFace: F.body, fontSize: 10, bold: true, color: C.secondary, charSpacing: 4,
  });
  s.addText(
    "db.resenas.find({ id_producto: 1001, estado: 'publicada' }).sort({ fecha: -1 });",
    {
      x: 0.75, y: 6.35, w: 11.8, h: 0.5,
      fontFace: F.mono, fontSize: 14, color: C.codeFg, valign: "middle",
    });

  brand(s); pageNumber(s, 6, TOTAL);
}

// =====================================================================
// SLIDE 7 — EVENTOS (time-series)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "COLECCION 02  ·  eventos");
  title(s, "Time-series para el comportamiento del cliente");

  // izquierda — por que time-series
  s.addText("Por que time-series", {
    x: 0.5, y: 1.95, w: 6.2, h: 0.4,
    fontFace: F.head, fontSize: 18, bold: true, color: C.primary,
  });
  s.addText(
    "Los eventos web se consultan SIEMPRE por ventana de tiempo + dimension " +
    "(sede, producto, tipo). MongoDB time-series agrupa fisicamente por " +
    "metaField + timeField y comprime los buckets. Escritura masiva barata, " +
    "agregaciones temporales rapidas.",
    {
      x: 0.5, y: 2.4, w: 6.2, h: 1.8,
      fontFace: F.body, fontSize: 13, color: C.text, valign: "top",
    });

  // stats grandes
  const stats = [
    { big: "90", lbl: "DIAS DE RETENCION\nautomatica via TTL" },
    { big: "5", lbl: "TIPOS DE EVENTO\nvista, busqueda, carrito,\nabandono, categoria" },
  ];
  stats.forEach((st, i) => {
    const y = 4.3 + i * 1.35;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.5, y, w: 6.2, h: 1.2, rectRadius: 0.08,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.5 },
    });
    s.addText(st.big, {
      x: 0.75, y: y + 0.05, w: 2.0, h: 1.1,
      fontFace: F.head, fontSize: 56, bold: true, color: C.accent, valign: "middle",
    });
    s.addText(st.lbl, {
      x: 2.8, y: y + 0.1, w: 3.7, h: 1.05,
      fontFace: F.body, fontSize: 11, color: C.text, valign: "middle",
    });
  });

  // derecha — config + esquema
  s.addShape(pres.ShapeType.roundRect, {
    x: 7.0, y: 1.95, w: 5.8, h: 4.95, rectRadius: 0.1,
    fill: { color: C.codeBg }, line: { color: C.codeBg, width: 0 },
  });
  s.addText("CONFIGURACION DE LA COLECCION", {
    x: 7.2, y: 2.05, w: 5.4, h: 0.35,
    fontFace: F.body, fontSize: 10, bold: true, color: C.secondary, charSpacing: 4,
  });
  const code = [
    "db.createCollection('eventos', {",
    "  timeseries: {",
    "    timeField:   'ts',",
    "    metaField:   'meta',",
    "    granularity: 'seconds'",
    "  },",
    "  expireAfterSeconds: 7776000",
    "});",
    "",
    "// documento",
    "{",
    "  ts: ISODate('...'),",
    "  meta: {",
    "    id_sede:     1,",
    "    tipo:        'vista_producto',",
    "    id_producto: 1001",
    "  },",
    "  payload: { categoria: 'Camisas' }",
    "}",
  ];
  s.addText(code.join("\n"), {
    x: 7.2, y: 2.45, w: 5.4, h: 4.4,
    fontFace: F.mono, fontSize: 11.5, color: C.codeFg, valign: "top",
  });

  brand(s); pageNumber(s, 7, TOTAL);
}

// =====================================================================
// SLIDE 8 — EVENTOS (consultas)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "COLECCION 02  ·  eventos");
  title(s, "Que pregunta del negocio responde cada consulta");

  const q = [
    ["Mas vistos por sede (7 dias)",     "Que esta llamando la atencion en cada sucursal"],
    ["Busquedas sin resultados",          "Que quiere el cliente y no tenemos en catalogo"],
    ["Embudo vista -> carrito -> abandono","Donde se pierden las conversiones del POS web"],
    ["Eventos por hora del dia",          "Curva de uso para planificar promociones y staffing"],
    ["Vistas por categoria por cliente",  "Senal de afinidad que alimenta el feed personal"],
  ];

  const rowH = 0.85, y0 = 2.1;
  q.forEach((r, i) => {
    const y = y0 + i * (rowH + 0.12);
    // numero grande
    s.addShape(pres.ShapeType.ellipse, {
      x: 0.55, y: y + 0.1, w: 0.65, h: 0.65,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText(String(i + 1), {
      x: 0.55, y: y + 0.1, w: 0.65, h: 0.65,
      fontFace: F.head, fontSize: 22, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    // tarjeta
    s.addShape(pres.ShapeType.roundRect, {
      x: 1.4, y, w: 11.4, h: rowH, rectRadius: 0.08,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.5 },
    });
    s.addText(r[0], {
      x: 1.65, y: y + 0.08, w: 5.6, h: 0.7,
      fontFace: F.head, fontSize: 16, bold: true, color: C.text, valign: "middle",
    });
    s.addText(r[1], {
      x: 7.4, y: y + 0.08, w: 5.2, h: 0.7,
      fontFace: F.body, italic: true, fontSize: 13, color: C.textSoft, valign: "middle",
    });
  });

  brand(s); pageNumber(s, 8, TOTAL);
}

// =====================================================================
// SLIDE 9 — FEED_CLIENTE (que es)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "COLECCION 03  ·  feed_cliente");
  title(s, "Vista materializada con caducidad automatica");

  s.addText("El equivalente NoSQL de Stock_Actual en SQL", {
    x: 0.5, y: 1.85, w: 12.3, h: 0.4,
    fontFace: F.head, italic: true, fontSize: 17, color: C.textSoft,
  });

  // 4 stats columnas
  const k = [
    { big: "1",  lbl: "FEED POR CLIENTE",     sub: "indice unico" },
    { big: "6h", lbl: "VIGENCIA",             sub: "TTL controlado" },
    { big: "12", lbl: "RECOMENDACIONES",      sub: "maximo por feed" },
    { big: "4",  lbl: "SENALES PONDERADAS",   sub: "algoritmo hibrido" },
  ];

  const cw = 2.95, gap = 0.2, y0 = 2.55;
  k.forEach((st, i) => {
    const x = 0.5 + i * (cw + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: y0, w: cw, h: 1.9, rectRadius: 0.1,
      fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
    });
    s.addText(st.big, {
      x, y: y0 + 0.1, w: cw, h: 1.0,
      fontFace: F.head, fontSize: 60, bold: true, color: "FFFFFF", align: "center",
    });
    s.addText(st.lbl, {
      x, y: y0 + 1.15, w: cw, h: 0.35,
      fontFace: F.body, fontSize: 11, bold: true, color: C.muted, align: "center", charSpacing: 3,
    });
    s.addText(st.sub, {
      x, y: y0 + 1.5, w: cw, h: 0.35,
      fontFace: F.body, italic: true, fontSize: 11, color: C.secondary, align: "center",
    });
  });

  // texto inferior
  s.addText("Patron y ciclo de vida", {
    x: 0.5, y: 4.75, w: 12.3, h: 0.4,
    fontFace: F.head, fontSize: 18, bold: true, color: C.primary,
  });

  const bullets = [
    "Un proceso lee el log de eventos y materializa el documento; el front lo lee con un find por id_cliente.",
    "El indice TTL borra el documento en el instante en que vigencia queda en el pasado.",
    "La siguiente visita del cliente activa la regeneracion bajo demanda. Si no vuelve, no se recalcula nada.",
    "Replace + upsert garantiza idempotencia: dos regeneraciones simultaneas no corrompen el feed.",
  ];
  bullets.forEach((b, i) => {
    const y = 5.25 + i * 0.42;
    dot(s, 0.55, y + 0.1, C.accent);
    s.addText(b, {
      x: 0.85, y, w: 11.9, h: 0.4,
      fontFace: F.body, fontSize: 12, color: C.text,
    });
  });

  brand(s); pageNumber(s, 9, TOTAL);
}

// =====================================================================
// SLIDE 10 — FEED_CLIENTE (algoritmo)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "COLECCION 03  ·  feed_cliente");
  title(s, "Las cuatro senales del algoritmo de recomendacion");

  s.addText("Pesos por hipotesis de intencion de compra", {
    x: 0.5, y: 1.85, w: 12.3, h: 0.4,
    fontFace: F.head, italic: true, fontSize: 16, color: C.textSoft,
  });

  // barras horizontales con peso
  const senales = [
    { n: "vistos_no_comprados", w: 1.0, t: "Lo miro pero no lo compro — intencion directa pendiente" },
    { n: "co_visitacion",       w: 0.8, t: "Quienes vieron lo mismo tambien vieron esto" },
    { n: "categoria_afin",      w: 0.6, t: "Afinidad declarada por las propias vistas del cliente" },
    { n: "trending_sede",       w: 0.4, t: "Contexto local — lo que es tendencia en su sucursal" },
  ];

  const barFullW = 8.5, barH = 0.45, y0 = 2.6;
  senales.forEach((s2, i) => {
    const y = y0 + i * 0.85;
    s.addText(s2.n, {
      x: 0.5, y, w: 3.2, h: 0.4,
      fontFace: F.mono, fontSize: 13, bold: true, color: C.text, valign: "middle",
    });
    // track
    s.addShape(pres.ShapeType.roundRect, {
      x: 3.8, y: y + 0.02, w: barFullW, h: barH, rectRadius: barH / 2,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.5 },
    });
    // fill
    s.addShape(pres.ShapeType.roundRect, {
      x: 3.8, y: y + 0.02, w: barFullW * s2.w, h: barH, rectRadius: barH / 2,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    // peso
    s.addText(s2.w.toFixed(1), {
      x: 12.4, y, w: 0.6, h: 0.4,
      fontFace: F.head, fontSize: 16, bold: true, color: C.accent, valign: "middle",
    });
    // descripcion
    s.addText(s2.t, {
      x: 3.8, y: y + 0.46, w: 8.5, h: 0.4,
      fontFace: F.body, fontSize: 11, color: C.textSoft,
    });
  });

  // reglas duras al pie
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 6.2, w: 12.3, h: 0.85, rectRadius: 0.08,
    fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
  });
  s.addText("REGLAS DURAS DESPUES DEL SCORING", {
    x: 0.75, y: 6.3, w: 6, h: 0.3,
    fontFace: F.body, fontSize: 10, bold: true, color: C.muted, charSpacing: 4,
  });
  s.addText("· no recomendar lo ya comprado     · no recomendar lo agotado en su sede", {
    x: 0.75, y: 6.6, w: 11.8, h: 0.4,
    fontFace: F.head, fontSize: 15, italic: true, color: "FFFFFF",
  });

  brand(s); pageNumber(s, 10, TOTAL);
}

// =====================================================================
// SLIDE 11 — INTEGRACION CON SQL
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "INTEGRACION");
  title(s, "Como conviven SQL Server y MongoDB");

  // flujo horizontal — 3 bloques con flecha
  const blockW = 3.8, blockH = 4.4, y0 = 2.1;
  const blocks = [
    {
      x: 0.5, color: C.primary, label: "SQL SERVER", h: "Verdad transaccional",
      items: [
        "Cliente autenticado",
        "Venta pagada con ese producto",
        "Stock real por sede",
        "Catalogo y precios",
      ],
    },
    {
      x: 4.7, color: C.accent, label: "APLICACION", h: "Capa de orquestacion",
      items: [
        "Verifica venta en SQL",
        "Inserta resena en Mongo",
        "Enriquece IDs -> nombres",
        "Dispara generarFeed",
      ],
    },
    {
      x: 8.9, color: C.muted, label: "MONGODB", h: "Capa de enriquecimiento",
      items: [
        "Resena auto-contenida",
        "Eventos en time-series",
        "Feed materializado",
        "TTL automatico",
      ],
    },
  ];

  blocks.forEach((b) => {
    s.addShape(pres.ShapeType.roundRect, {
      x: b.x, y: y0, w: blockW, h: blockH, rectRadius: 0.1,
      fill: { color: b.color }, line: { color: b.color, width: 0 },
    });
    s.addText(b.label, {
      x: b.x + 0.3, y: y0 + 0.3, w: blockW - 0.6, h: 0.4,
      fontFace: F.body, fontSize: 11, bold: true, color: "FFFFFF", charSpacing: 5,
    });
    s.addText(b.h, {
      x: b.x + 0.3, y: y0 + 0.65, w: blockW - 0.6, h: 0.6,
      fontFace: F.head, fontSize: 19, bold: true, color: "FFFFFF",
    });
    b.items.forEach((it, j) => {
      const yi = y0 + 1.6 + j * 0.55;
      dot(s, b.x + 0.35, yi + 0.12, "FFFFFF");
      s.addText(it, {
        x: b.x + 0.6, y: yi, w: blockW - 0.8, h: 0.4,
        fontFace: F.body, fontSize: 12, color: "FFFFFF",
      });
    });
  });

  // flechas (chevrones)
  [4.5, 8.7].forEach((x) => {
    s.addShape(pres.ShapeType.chevron, {
      x, y: y0 + 2.0, w: 0.25, h: 0.4,
      fill: { color: C.textSoft }, line: { color: C.textSoft, width: 0 },
    });
  });

  s.addText("La capa de aplicacion es el unico punto que cruza los dos motores. Cada motor sigue siendo el dueno de su dominio.", {
    x: 0.5, y: 6.75, w: 12.3, h: 0.4,
    fontFace: F.head, italic: true, fontSize: 13, color: C.textSoft, align: "center",
  });

  brand(s); pageNumber(s, 11, TOTAL);
}

// =====================================================================
// SLIDE 12 — REGLAS DE NEGOCIO
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "REGLAS DE NEGOCIO");
  title(s, "Lo que el sistema garantiza, no lo que la app valida");

  const reglas = [
    ["R-01", "Solo el cliente que compro puede resenar",       "Verificacion en SQL antes del insert"],
    ["R-02", "Una opinion por compra (cliente + producto + venta)", "Indice unico compuesto en Mongo"],
    ["R-03", "Rating obligatorio entre 1 y 5",                 "Validador $jsonSchema"],
    ["R-04", "Resena oculta no se ve en publico",              "Filtro por estado en la consulta"],
    ["R-05", "Nombres siempre actuales (cliente / producto)",  "Mongo guarda IDs; nombres se resuelven al servir"],
    ["R-06", "Eventos retenidos 90 dias",                       "TTL automatico de la coleccion"],
    ["R-07", "Feed personalizado caduca a las 6 horas",         "Indice TTL sobre vigencia"],
    ["R-08", "No recomendar lo agotado en la sede del cliente", "Cruce con Stock_Actual al materializar"],
  ];

  // dos columnas de 4
  const colW = 6.05, rowH = 1.1, y0 = 2.0;
  reglas.forEach((r, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const x = 0.5 + col * (colW + 0.2);
    const y = y0 + row * (rowH + 0.15);

    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: colW, h: rowH, rectRadius: 0.08,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.5 },
    });
    s.addShape(pres.ShapeType.rect, {
      x, y, w: 0.85, h: rowH,
      fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
    });
    s.addText(r[0], {
      x, y, w: 0.85, h: rowH,
      fontFace: F.head, fontSize: 14, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addText(r[1], {
      x: x + 1.0, y: y + 0.1, w: colW - 1.15, h: 0.5,
      fontFace: F.head, fontSize: 13, bold: true, color: C.text,
    });
    s.addText(r[2], {
      x: x + 1.0, y: y + 0.6, w: colW - 1.15, h: 0.45,
      fontFace: F.body, italic: true, fontSize: 11, color: C.accent,
    });
  });

  brand(s); pageNumber(s, 12, TOTAL);
}

// =====================================================================
// SLIDE 13 — CUMPLIMIENTO DE RUBRICA
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  sectionBadge(s, "DEFENSA");
  title(s, "Como se cubren los 50 puntos del modulo NoSQL");

  s.addText("Criterio de la rubrica  /  Cobertura del proyecto", {
    x: 0.5, y: 1.95, w: 12.3, h: 0.4,
    fontFace: F.head, italic: true, fontSize: 15, color: C.textSoft,
  });

  const rub = [
    ["Insercion de datos",
     "Scripts 01-02 con insercion validada contra SQL via funcion insertarResena."],
    ["Consulta de datos",
     "Scripts 03-04-06 con mas de 15 consultas productivas que alimentan UI real."],
    ["Uso de estructuras adecuadas",
     "Documento con $jsonSchema, time-series con TTL, vista materializada con TTL."],
    ["Consultas relevantes al negocio",
     "Histograma de rating, embudo de conversion, top vistos, busquedas fallidas, feed."],
  ];

  const rowH = 1.0, y0 = 2.55;
  rub.forEach((r, i) => {
    const y = y0 + i * (rowH + 0.18);
    // check verde
    s.addShape(pres.ShapeType.ellipse, {
      x: 0.55, y: y + 0.2, w: 0.6, h: 0.6,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText("✓", {
      x: 0.55, y: y + 0.2, w: 0.6, h: 0.6,
      fontFace: F.head, fontSize: 22, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    s.addShape(pres.ShapeType.roundRect, {
      x: 1.3, y, w: 11.5, h: rowH, rectRadius: 0.08,
      fill: { color: C.card }, line: { color: C.secondary, width: 0.5 },
    });
    s.addText(r[0], {
      x: 1.55, y: y + 0.12, w: 11, h: 0.4,
      fontFace: F.head, fontSize: 15, bold: true, color: C.primary,
    });
    s.addText(r[1], {
      x: 1.55, y: y + 0.55, w: 11, h: 0.45,
      fontFace: F.body, fontSize: 12, color: C.text,
    });
  });

  brand(s); pageNumber(s, 13, TOTAL);
}

// =====================================================================
// SLIDE 14 — CIERRE
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgDark };

  // motif: lineas de acento
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.15,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 7.35, w: 13.333, h: 0.15,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });

  s.addText("EN RESUMEN", {
    x: 0.7, y: 1.0, w: 8, h: 0.4,
    fontFace: F.body, fontSize: 14, bold: true, color: C.muted, charSpacing: 8,
  });

  s.addText("MongoDB no se incluyo por modernidad.\nSe incluyo por necesidad arquitectonica.", {
    x: 0.7, y: 1.6, w: 12, h: 1.8,
    fontFace: F.head, fontSize: 36, bold: true, color: "FFFFFF",
  });

  s.addText(
    "Cada coleccion resuelve un problema que el modelo relacional resolveria " +
    "mal o a un costo desproporcionado. Cada decision tecnica esta justificada " +
    "por una razon de negocio: 'una opinion por compra' como indice unico, " +
    "'90 dias' como retencion de eventos, '6 horas' como contrato de frescura del feed.",
    {
      x: 0.7, y: 3.7, w: 11.5, h: 2.0,
      fontFace: F.head, italic: true, fontSize: 17, color: C.secondary,
    });

  // tres tags inferior
  const tags = ["$jsonSchema", "time-series + TTL", "vista materializada"];
  tags.forEach((t, i) => {
    const x = 0.7 + i * 4.2;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 6.1, w: 3.9, h: 0.7, rectRadius: 0.35,
      fill: { color: C.primary }, line: { color: C.muted, width: 1 },
    });
    s.addText(t, {
      x, y: 6.1, w: 3.9, h: 0.7,
      fontFace: F.mono, fontSize: 14, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
  });
}

// ========== SAVE ==========
pres.writeFile({ fileName: "Presentacion_NoSQL_MongoDB.pptx" })
  .then((f) => console.log("OK:", f));
