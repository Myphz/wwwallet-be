import { MONGO_URI } from "./config.js";
import mongoose from "mongoose";

export default function connectDB() {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}