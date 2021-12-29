import { MongoClient } from 'mongodb'

//const uri = process.env.MONGODB_URI
//const db = process.env.MONGODB_DB
const { MONGODB_URI, MONGODB_DB } = process.env

const options:any = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

let client: any
let clientPromise: any

let cachedClient:any = null
let cachedDb:any = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return {
      client: cachedClient,
      db: cachedDb
    }
  }
  if (MONGODB_URI !== undefined) {
    let client = new MongoClient(MONGODB_URI, options)
    await client.connect()
    let db = client.db(MONGODB_DB)

    cachedClient = client
    cachedDb = db
    return {
      client: cachedClient,
      db: cachedDb
    }
  } else {
    throw new Error('Please add your Mongo URI to .env.local')
  }
}
/*
if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
} else {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    //@ts-ignore
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      //@ts-ignore
      global._mongoClientPromise = client.connect()
    }
    //@ts-ignore
    clientPromise = global._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
*/