import clientPromise from "../lib/db/mongodb";

async function resetDatabase() {
  const client = await clientPromise;

  try {
    const db = client.db("lender_workspace");

    console.log("Dropping database: lender_workspace");

    await db.dropDatabase();

    console.log("Database cleared successfully.");
  } finally {
    await client.close();
  }
}

resetDatabase().catch((error) => {
  console.error("Failed to reset database:", error);
  process.exit(1);
});