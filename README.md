# TiendaRopa

Sistema ERP distribuido para una cadena de tiendas de ropa con presencia en
multiples sedes. Arquitectura hibrida SQL Server + MongoDB sobre Next.js 15.

---

## Rama de trabajo

> **Trabajar siempre en la rama `master`.**

```bash
git checkout master
git pull origin master
```

Cualquier cambio se hizo contra `master`. No se uso `main` ni otras ramas.

---

## Apuntes de clase (Notion)

| Integrante | Enlace |
| --- | --- |
| Karen Landivar | <https://app.notion.com/p/Bases-de-Datos-II-d4da7085fbaf8205a52701b8abe7a2a4?source=copy_link> |
| Adriana Hernández | <https://app.notion.com/p/Base-de-Datos-II-307e524ad19d81c9a9acf6f1c29e0bf3?source=copy_link> |


---

## Arranque rapido

```bash
# 1) Clonar y entrar
git clone <REPO_URL>
cd "Tienda de Ropa"
git checkout master

# 2) Dependencias
cd shared-component-system
pnpm install

# 3) Variables de entorno
cp .env.example .env.local
# Edite DB_SERVER, DB_USER, DB_PASSWORD, MONGODB_URI

# 4) Iniciar el servidor de desarrollo
pnpm dev
```

---

## Documentacion del proyecto

Toda la documentacion tecnica del modulo NoSQL esta en
[`documentacion/Documentacion_NoSQL_MongoDB.docx`](documentacion/Documentacion_NoSQL_MongoDB_.docx)
y la presentacion en
[`documentacion/Presentacion_NoSQL_MongoDB.pptx`](documentacion/Presentacion_NoSQL_MongoDB.pptx).

Los scripts SQL viven en [`SQL/`](SQL/) y los scripts de MongoDB en
[`MongoDB/`](MongoDB/).
