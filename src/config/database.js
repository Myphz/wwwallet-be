import { MONGO_URI } from "./config.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

export default async function connectDB() {
  // Don't connect to the database in test mode or if the uri is not defined
  if (process.env.NODE_ENV === "test" || !MONGO_URI) {
    global.mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(global.mongoServer.getUri());
    return;
  };

  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}