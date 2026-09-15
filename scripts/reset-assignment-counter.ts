import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import clientPromise from "../lib/db/mongodb";

async function resetCounters() {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB
  );

  const result = await db
    .collection("assignment_counters")
    .deleteMany({});

  console.log(
    `Deleted ${result.deletedCount} assignment counter(s).`
  );

  await client.close();

  console.log("All assignment counters reset.");
}

resetCounters()
  .catch((error) => {
    console.error(
      "Reset failed:",
      error
    );

    process.exit(1);
  });