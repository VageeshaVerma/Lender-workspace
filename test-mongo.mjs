import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});

try {
  await client.connect();

  console.log("CONNECTED");

  const result = await client
    .db(process.env.MONGODB_DB)
    .command({ ping: 1 });

  console.log(result);
} catch (error) {
  console.error("FAILED");
  console.error(error);
} finally {
  await client.close();
}