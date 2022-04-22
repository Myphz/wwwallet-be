import fetch from "node-fetch";
import express from "express";
import fs from "fs";
import { BINANCE_BASE_URL, COINMARKETCAP_API_KEY } from "../config/config.js";
import { BINANCE_ERROR } from "../config/errors.js";

const router = express.Router();

// Middleware endpoint to redirect binance API calls (as they don't work in the browser)
router.get("/binance/*", async (req, res, next) => {
  try {
    // Construct the URL with the given endpoint and params
    const data = await fetch(`${BINANCE_BASE_URL}${req.params[0]}?${new URLSearchParams(req.query)}`);
    res.json(await data.json());
  } catch {
    next(BINANCE_ERROR);
  }
});

router.get("/info", async (req, res, next) => {
  const response = await fetch("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000", {
    headers: {
      "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY
    }
  });

  let { data } = await response.json();
  const ret = {};

  for (const crypto of data) {
    const { name, symbol } = crypto;
    if (symbol in ret) continue;
    ret[symbol] = {
      name,
      mcap: crypto.quote["USD"]["market_cap"]
    }
  };

  res.json(ret);
});

// Error handler
router.use((err, req, res, next) => {
	res.status(err.status);
	res.json({ success: false, msg: err.message });
});

export default router;