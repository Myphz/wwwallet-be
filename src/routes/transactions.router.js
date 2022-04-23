import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateParams from "../middlewares/validateParams.middleware.js";
import { SERVER_ERROR, TRANSACTION_NOT_FOUND } from "../config/errors.js";

const router = express.Router();

const validator = {
  crypto: {
    type: String
  },

  quote: {
    type: String,
  },

  isBuy: {
    type: Boolean,
  },

  price: {
    type: Number,
  },

  quantity: {
    type: Number,
  },

  date: {
    type: Number,
    validator: date => date <= +new Date()
  },
};

// Get all transactions
router.get("/", authMiddleware, (req, res) => {
  res.json({ success: true, transactions: req.user.transactions });
});

// Create new transaction
router.post("/", authMiddleware, validateParams(validator), (req, res, next) => {
  const { crypto, quote, isBuy, price, quantity, date } = req.body;

  // Check if the crypto is already in the Map
  if (req.user.transactions.has(crypto)) {
    // If so, add the new transaction
    req.user.transactions.get(crypto).push({ quote, isBuy, price, quantity, date });
  } else {
    // Otherwise, create key
    req.user.transactions.set(crypto, [{ quote, isBuy, price, quantity, date }]);
  }

  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };

    res.json({ success: true });
  });
});

// Update existing transaction
router.put("/", authMiddleware, validateParams({ id: { type: String }, ...validator }), (req, res, next) => {
  const { id, crypto, quote, isBuy, price, quantity, date } = req.body;

  if (!req.user.transactions.has(crypto)) return next(TRANSACTION_NOT_FOUND);
  const i = req.user.transactions.get(crypto).findIndex(transaction => transaction._id.toString() === id);
  if (i === -1) return next(TRANSACTION_NOT_FOUND);

  req.user.transactions.get(crypto)[i] = { quote, isBuy, price, quantity, date };

  req.user.markModified("transactions");
  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };

    res.json({ success: true, newId: req.user.transactions.get(crypto)[i]._id });
  });
});

// Delete transaction
router.delete("/", authMiddleware, validateParams({ id: { type: String }, crypto: { type: String } }), (req, res, next) => {
  const { id, crypto } = req.body;

  if (!req.user.transactions.has(crypto)) return next(TRANSACTION_NOT_FOUND);
  const i = req.user.transactions.get(crypto).findIndex(transaction => transaction._id.toString() === id);
  if (i === -1) return next(TRANSACTION_NOT_FOUND);

  // Remove the transaction at the specific index
  req.user.transactions.get(crypto).splice(i, 1);
  // Delete the key if there are no transactions
  if (req.user.transactions.get(crypto).length === 0) req.user.transactions.delete(crypto);

  req.user.markModified("transactions");
  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };

    res.json({ success: true });
  });
});

// Error handler function
router.use((err, req, res, next) => {
	res.status(err.status);
	res.json({ success: false, msg: err.message });
});

export default router;