import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";
import type { Role, SafeUser } from "@/types/auth";
export type UserDocument = { _id: ObjectId; name: string; email: string; passwordHash: string; role: Role; phone?: string; city?: string; bio?: string; createdAt: Date; updatedAt: Date };
export function toSafeUser(user: UserDocument): SafeUser {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role, ...(user.phone ? { phone: user.phone } : {}), ...(user.city ? { city: user.city } : {}), ...(user.bio ? { bio: user.bio } : {}) };
}
export async function ensureUserIndexes() { await (await getDatabase()).collection<UserDocument>("users").createIndex({ email: 1 }, { unique: true }); }
export async function findUserByEmail(email: string) { return (await getDatabase()).collection<UserDocument>("users").findOne({ email }); }
export async function findUserById(id: string) { return ObjectId.isValid(id) ? (await getDatabase()).collection<UserDocument>("users").findOne({ _id: new ObjectId(id) }) : null; }
export async function getCurrentUser() {
  const { getSession } = await import("./session");
  const session = await getSession();
  if (!session) return null;
  const user = await findUserById(session.userId);
  return user ? toSafeUser(user) : null;
}
