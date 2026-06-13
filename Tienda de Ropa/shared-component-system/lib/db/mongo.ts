import { MongoClient, Db } from "mongodb"

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined
  mongoClientPromise: Promise<MongoClient> | undefined
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("Falta variable de entorno MONGODB_URI.")
  return uri
}

function getClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(getMongoUri())
    globalForMongo.mongoClientPromise = client.connect().then((c) => {
      globalForMongo.mongoClient = c
      return c
    })
  }
  return globalForMongo.mongoClientPromise
}

export async function getMongoDB(): Promise<Db> {
  const client = await getClient()
  return client.db("tiendaropa_nosql")
}
