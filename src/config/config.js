// Load .env config
import { config } from "dotenv";
config();

export const PORT = 3000;

export const JWT_KEY = process.env.JWT_KEY;
export const MONGO_URI = process.env.NODE_ENV === "test" ? process.env.MONGO_TEST_URI : process.env.MONGO_URI;
export const COOKIE_OPTS = {
  secure: true,
  httpOnly: true,
  overwrite: true
};

export const SALT_ROUNDS = 10;

export const BINANCE_BASE_URL = "https://api.binance.com/api/v3/";
export const COINMARKETCAP_BASE_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/";
export const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;