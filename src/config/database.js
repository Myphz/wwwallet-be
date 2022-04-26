import { MONGO_URI } from "./config.js";
import mongoose from "mongoose";

export default function connectDB() {
  // In test mode, don't connect to the real database
  if (process.env.NODE_ENV === "test") return;
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}