import crypto from "crypto";
import clientPromise from "./mongodb";

export async function createInvite(
  lenderId: string,
  email: string,
  role: string,
  invitedBy: string   //comes from the authenticated session
) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  await db.collection("invites").insertOne({
    tokenHash,
    lenderId,
    email: email.toLowerCase(),
    role,
    invitedBy,
    expiresAt,
    used: false,
    createdAt: new Date(),
  });

  return token;
}