import fetch from "node-fetch";
import express from "express";
import isFileValid from "../helpers/isFileValid.helper.js";
import fs from "fs";
import { BINANCE_BASE_URL, COINMARKETCAP_BASE_URL, COINMARKETCAP_API_KEY, COINMARKETCAP_LIMIT, CRYTPO_INFO_FILE } from "../config/config.js";
import { BINANCE_ERROR } from "../config/errors.js";

const router = express.Router();

// Middleware endpoint to redirect binance API calls (as they don't work in the browser)
router.get("/binance/*", async (req, res, next) => {
  // Construct the URL with the given endpoint and params
  const data = await fetch(`${BINANCE_BASE_URL}${req.params[0]}?${new URLSearchParams(req.query)}`);
  // Return error if the endpoint hasn't been found
  if (!data.ok) return next(BINANCE_ERROR);
  res.json(await data.json());
});

// Middleware endpoint to get market cap and name-symbol conversion for the top 5000 crypto.
// IMPORTANT: To limit the traffic to CoinMarketCAP API, the response will be cached in a JSON file
// For a maximum amount of 1 day (as set in the config file).
router.get("/info", async (req, res, next) => {
  // Check if the info have already been cached
  if (isFileValid()) return res.json(JSON.parse(fs.readFileSync(CRYTPO_INFO_FILE)));
  // Send request to coinmarketcap API
  const response = await fetch(`${COINMARKETCAP_BASE_URL}listings/latest?limit=${COINMARKETCAP_LIMIT}`, {
    headers: {
      "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY
    }
  });

  const { data, status } = await response.json();
  // Return error if an error has occurred
  if (status.error_code) return next({ status: response.status, msg: status.error_message });

  const ret = {};
  for (const crypto of data) {
    const { name, symbol } = crypto;
    if (symbol in ret) continue;
    ret[symbol] = {
      name,
      mcap: crypto.quote["USD"]["market_cap"]
    }
  };

  // Cache file
  fs.writeFile(CRYTPO_INFO_FILE, JSON.stringify(ret), err => {
    if (err) console.log(err);
  });

  res.json(ret);
});

// Error handler
router.use((err, req, res, next) => {
	res.status(err.status);
	res.json({ success: false, msg: err.message });
});

export default router;