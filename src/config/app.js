// Load database configuration
import connectDB from "./database";
connectDB();
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();

// Only allow requests from FE
app.use(cors({ origin: "http://localhost:5000", credentials: true }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

export default app;