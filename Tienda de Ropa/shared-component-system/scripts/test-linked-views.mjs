import sql from "mssql"
import { readFileSync } from "fs"
import { resolve } from "path"

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    for (const line of raw.split("\n")) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const i = t.indexOf("=")
      if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
  } catch {
  }
}

loadEnv()

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE ?? "TiendaRopa",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT !== "false",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
}

const queries = [
  ["linked test", `SELECT TOP 1 1 AS ok FROM SEDE.TiendaRopa.Configuracion.Sede`],
  ["vw clientes", `SELECT TOP 3 Sede FROM Persona.vw_Clientes_Global_TiempoReal`],
  ["vw ventas", `SELECT TOP 3 Sede FROM Ventas.vw_Ventas_Hoy_Global`],
]

console.log("Config:", { server: config.server, user: config.user, database: config.database })

const pool = await sql.connect(config)
const who = await pool.request().query(
  "SELECT SUSER_SNAME() AS login_sql, USER_NAME() AS usuario_bd"
)
console.log("Sesión SQL:", who.recordset[0])
for (const [name, q] of queries) {
  try {
    const r = await pool.request().query(q)
    console.log(name, "OK", r.recordset)
  } catch (e) {
    console.log(name, "FAIL", e.message)
  }
}
await pool.close()
