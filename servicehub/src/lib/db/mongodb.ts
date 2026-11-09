import { MongoClient } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;
declare global { var _mongoClientPromise: Promise<MongoClient> | undefined; }

export function getMongoClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) global._mongoClientPromise = new MongoClient(uri).connect();
    clientPromise = global._mongoClientPromise;
  } else if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}
