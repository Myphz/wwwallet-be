// Load .env config
import { config } from "dotenv";
config();

export const PORT = 3000;

export const JWT_KEY = process.env.JWT_KEY;
export const MONGO_URI = process.env.MONGO_URI;
export const COOKIE_OPTS = {
  secure: true,
  httpOnly: true,
  overwrite: true
};

export const SALT_ROUNDS = 10;

export const BINANCE_BASE_URL = "https://api.binance.com/api/v3/";
export const COINMARKETCAP_BASE_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/";
export const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
export const COINMARKETCAP_LIMIT =  process.env.NODE_ENV === "test" ? 1 : 5000; // How many crypto to pull from coinmarketcap

export const CRYTPO_INFO_FILE = "src/data/cryptoInfo.json";
// Amount of milliseconds the CRYPTO_INFO_FILE is valid for (1 day). If the file is older than that, it will be refreshed.
export const CRYPTO_INFO_REFRESH_TIME = 86400000 