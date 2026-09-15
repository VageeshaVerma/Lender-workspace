import clientPromise from "./mongodb"; //reuse exisiting mongodb connection
import { ObjectId } from "mongodb";
//reusable functions for performing user-related database operations.

export async function getUserByEmail(email: string) {  //returns a Promise.
  const client = await clientPromise;   //Wait until the MongoDB client is available

  const db = client.db(process.env.MONGODB_DB);

  return db.collection("users").findOne({
    email: email.toLowerCase(),
  });
}

export async function getUserById(userId: string) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const client = await clientPromise;

  const db = client.db(process.env.MONGODB_DB);

  return db.collection("users").findOne({
    _id: new ObjectId(userId),
  });
}