// Load database configuration
import connectDB from "./database.js";
connectDB();

import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { BASE_URL } from "./config.js";

const app = express();
// Always allow requests from "localhost" (android version)
app.use(cors({ origin: [BASE_URL, "http://localhost"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// For express-rate-limit
if (process.env.NODE_ENV !== "production") {
  app.set("trust proxy", 2);
}

export default app;