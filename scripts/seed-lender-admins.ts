import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import clientPromise from "../lib/db/mongodb";

const lenders = [
  {
    lenderId: "ram-fincorp",
    name: "Ram FinCorp",
    email: "ramadmin@lender.com",
  },
  {
    lenderId: "mudraboxx",
    name: "Mudraboxx",
    email: "admin@lender.com",
  },
  {
    lenderId: "creditsea-direct",
    name: "CreditSea",
    email: "creditseaadmin@lender.com",
  },
  {
    lenderId: "cashvia",
    name: "Cashvia",
    email: "cashviaadmin@lender.com",
  },
  {
    lenderId: "smallpocket",
    name: "Small Pocket",
    email: "smallpocketadmin@lender.com",
  },
];

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const passwordHash = await bcrypt.hash("admin123", 12);

  for (const lender of lenders) {
    console.log(`\n=== ${lender.name} ===`);

    await db.collection("users").updateOne(
      { email: lender.email },
      {
        $set: {
          name: `${lender.name} Admin`,
          email: lender.email,
          passwordHash,
          role: "lender_admin",
          lenderId: lender.lenderId,
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`Admin: ${lender.email}`);
    console.log(`Lender ID: ${lender.lenderId}`);
  }

  console.log("\nAll lender admins seeded successfully.");
}

main().catch((error) => {
  console.error("Error seeding lender admins:", error);
  process.exit(1);
});