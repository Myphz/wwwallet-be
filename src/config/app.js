// Load database configuration
import connectDB from "./database.js";
connectDB();

import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { BASE_URL } from "./config.js";

const app = express();
app.use(cors({ origin: BASE_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// For express-rate-limit
app.set("trust proxy", 1);

export default app;