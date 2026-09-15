import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import bcrypt from "bcryptjs";
import clientPromise from "../lib/db/mongodb";

const agents = [
  // Ram FinCorp
  {
    lenderId: "ram-fincorp",
    name: "Ram Agent 1",
    email: "ramagent1@lender.com",
  },
  {
    lenderId: "ram-fincorp",
    name: "Ram Agent 2",
    email: "ramagent2@lender.com",
  },

  // Mudraboxx
  {
    lenderId: "mudraboxx",
    name: "Mudra Agent 1",
    email: "mudraagent1@lender.com",
  },
  {
    lenderId: "mudraboxx",
    name: "Mudra Agent 2",
    email: "mudraagent2@lender.com",
  },

  // CreditSea
  {
    lenderId: "creditsea-direct",
    name: "CreditSea Agent 1",
    email: "creditseaagent1@lender.com",
  },
  {
    lenderId: "creditsea-direct",
    name: "CreditSea Agent 2",
    email: "creditseaagent2@lender.com",
  },

  // Cashvia
  {
    lenderId: "cashvia",
    name: "Cashvia Agent 1",
    email: "cashviaagent1@lender.com",
  },
  {
    lenderId: "cashvia",
    name: "Cashvia Agent 2",
    email: "cashviaagent2@lender.com",
  },

  // Small Pocket
  {
    lenderId: "smallpocket",
    name: "Small Pocket Agent 1",
    email: "smallpocketagent1@lender.com",
  },
  {
    lenderId: "smallpocket",
    name: "Small Pocket Agent 2",
    email: "smallpocketagent2@lender.com",
  },
];

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  try {
    const passwordHash = await bcrypt.hash("agent123", 12);

    for (const agent of agents) {
      console.log(`\n=== ${agent.name} ===`);

      await db.collection("users").updateOne(
        { email: agent.email },
        {
          $set: {
            name: agent.name,
            email: agent.email,
            passwordHash,
            role: "lender_agent",
            lenderId: agent.lenderId,
            isActive: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(`Agent: ${agent.email}`);
      console.log(`Lender ID: ${agent.lenderId}`);
    }

    console.log("\nAll lender agents seeded successfully.");
    console.log("Default password: agent123");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Error seeding lender agents:", error);
  process.exit(1);
});