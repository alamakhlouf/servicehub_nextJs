import { getMongoClientPromise } from "./mongodb";
export async function getDatabase() {
  const databaseName = process.env.MONGODB_DB;
  if (!databaseName && process.env.NODE_ENV === "production") {
    throw new Error("Missing MONGODB_DB environment variable");
  }
  return (await getMongoClientPromise()).db(databaseName ?? "servicehub");
}
