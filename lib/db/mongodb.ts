import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { MongoClient } from "mongodb";   //communicate with MongoDB

const uri = process.env.MONGODB_URI;   //access the MongoDB connection string  MONGODB_URI -> MongoClient ->  MongoDB server

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

const options = {
  serverSelectionTimeoutMS: 10000,  //wait up to 10 seconds when trying to select/reach an appropriate server
};

declare global {  //global._mongoClient   global is object
  var _mongoClient: MongoClient | undefined;  //reuse an existing MongoDB client rather than repeatedly creating new clients
}

const client =
  global._mongoClient ??
  new MongoClient(uri, options);

if (process.env.NODE_ENV !== "production") {
  global._mongoClient = client;   //store MongoClient globally
}

const clientPromise = client.connect();  //starts the MongoDB connection. Notice that it returns a Promise.

export default clientPromise;