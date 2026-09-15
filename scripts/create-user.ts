import bcrypt from "bcryptjs";
import clientPromise from "../lib/db/mongodb";

const lenders = [
  {
    lenderId: "ram-fincorp",
    name: "Ram FinCorp",
    prefix: "ram",
  },
  {
    lenderId: "mudraboxx",
    name: "Mudraboxx",
    prefix: "mudraboxx",
  },
  {
    lenderId: "creditsea-direct",
    name: "CreditSea",
    prefix: "creditsea",
  },
  {
    lenderId: "cashvia",
    name: "Cashvia",
    prefix: "cashvia",
  },
  {
    lenderId: "smallpocket",
    name: "Small Pocket",
    prefix: "smallpocket",
  },
];

async function createUsers() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const passwordHash = await bcrypt.hash("admin123", 12);

  for (const lender of lenders) {
    console.log(`\n=== ${lender.name} ===`);

    for (let i = 1; i <= 5; i++) {
      const email = `${lender.prefix}agent${i}@lender.com`;
      const name = `${lender.name} Agent ${i}`;

      const existingUser = await db
        .collection("users")
        .findOne({
          email,
        });

      if (existingUser) {
        console.log(`Already exists: ${email}`);
        continue;
      }

      await db.collection("users").insertOne({
        name,
        email,
        passwordHash,
        role: "lender_agent",
        lenderId: lender.lenderId,
        isActive: true,
        createdAt: new Date(),
      });

      console.log(
        `Created: ${email} → ${lender.lenderId}`
      );
    }
  }

  console.log(
    "\nAll agent creation checks completed."
  );

  await client.close();
}

createUsers().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});