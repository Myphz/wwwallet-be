import { DB_STRING } from "./config";
import mongoose from "mongoose";

export default function connectDB() {
  mongoose.connect(DB_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}