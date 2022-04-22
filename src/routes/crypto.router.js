import fetch from "node-fetch";
import express from "express";
import { BINANCE_BASE_URL } from "../config/config.js";
import { BINANCE_ERROR } from "../config/errors.js";

const router = express.Router();

// Middleware endpoint to redirect binance API calls (as they don't work in the browser)
router.get("/*", async (req, res, next) => {
  try {
    // Construct the URL with the given endpoint and params
    const data = await fetch(`${BINANCE_BASE_URL}${req.params[0]}?${new URLSearchParams(req.query)}`);
    res.json(await data.json());
  } catch {
    next(BINANCE_ERROR);
  }
});

// Error handler
router.use((err, req, res, next) => {
	res.status(err.status);
	res.json({ success: false, msg: err.message });
});

export default router;