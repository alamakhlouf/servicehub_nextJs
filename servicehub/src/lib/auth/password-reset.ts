import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/database";

const resetTokenTtlMs = 60 * 60 * 1000;

type PasswordResetDocument = {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: ObjectId) {
  const collection = (await getDatabase()).collection<PasswordResetDocument>("passwordResetTokens");
  const now = new Date();
  await collection.deleteMany({ userId });
  const token = randomBytes(32).toString("base64url");
  await collection.insertOne({ _id: new ObjectId(), userId, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + resetTokenTtlMs), createdAt: now });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const collection = (await getDatabase()).collection<PasswordResetDocument>("passwordResetTokens");
  const record = await collection.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() }, usedAt: { $exists: false } });
  if (!record) return null;
  const consumed = await collection.updateOne({ _id: record._id, usedAt: { $exists: false } }, { $set: { usedAt: new Date() } });
  return consumed.modifiedCount === 1 ? record.userId : null;
}

export async function ensurePasswordResetIndexes() {
  const collection = (await getDatabase()).collection<PasswordResetDocument>("passwordResetTokens");
  await Promise.all([
    collection.createIndex({ tokenHash: 1 }, { unique: true }),
    collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collection.createIndex({ userId: 1 }),
  ]);
}
