// Load .env config
import { config } from "dotenv";
config();

export const PORT = 3000;
export const JWT_KEY = process.env.JWT_KEY;
export const DB_STRING = process.env.DB_TEST || process.env.DB_STRING;
export const SALT_ROUNDS = 10;
export const COOKIE_OPTS = {
  secure: true,
  httpOnly: true,
  overwrite: true
};