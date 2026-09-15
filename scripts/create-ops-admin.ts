import bcrypt from "bcryptjs";
import clientPromise from "../lib/db/mongodb";

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const passwordHash = await bcrypt.hash("admin123", 12);

  await db.collection("users").updateOne(
    { email: "ops@lender.com" },
    {
      $set: {
        email: "ops@lender.com",
        passwordHash,
        name: "Operations Admin",
        role: "ops_admin",
        lenderId: null,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log("Ops admin created/updated successfully.");
  console.log("Email: ops@lender.com");
  console.log("Password: admin123");

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});