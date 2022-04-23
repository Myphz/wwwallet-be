import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateParams from "../middlewares/validateParams.middleware.js";
import { SERVER_ERROR, TRANSACTION_NOT_FOUND } from "../config/errors.js";
import { findTransactionByID } from "../helpers/transaction.helper.js";

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
  const transactions = req.user.transactions;

  // Check if the crypto is already in the Map
  if (crypto in transactions) {
    // If so, add the new transaction
    transactions[crypto].push({ quote, isBuy, price, quantity, date });
  } else {
    // Otherwise, create key
    transactions[crypto] = [{ quote, isBuy, price, quantity, date }];
  }

  req.user.transactions = transactions;
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
  const transactions = req.user.transactions;

  // Find crypto & index of the transaction to replace
  let { replaceCrypto, i } = findTransactionByID(transactions, id);
  if (!replaceCrypto) return next(TRANSACTION_NOT_FOUND);

  // If the crypto has changed, remove the transaction and add a new one
  if (replaceCrypto !== crypto) {
    transactions[replaceCrypto].splice(i, 1);
    // Check if the replaceCrypto transactions key is empty. If so, delete it
    if (!transactions[replaceCrypto].length) delete transactions[replaceCrypto];
    // Check if the new crypto transaction key is empty. If so, add it
    if (!transactions[crypto]) transactions[crypto] = [];

    transactions[crypto].push({ quote, isBuy, price, quantity, date });
    i = transactions[crypto].length - 1;
  } else {
    transactions[crypto][i] = { quote, isBuy, price, quantity, date };
  };

  req.user.transactions = transactions;
  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };

    res.json({ success: true, newId: req.user.transactions[crypto][i]._id });
  });
});

// Delete transaction
router.delete("/", authMiddleware, validateParams({ id: { type: String } }), (req, res, next) => {
  const { id } = req.body;
  const transactions = req.user.transactions;

  const { replaceCrypto, i } = findTransactionByID(transactions, id);
  if (!replaceCrypto) return next(TRANSACTION_NOT_FOUND);

  // Remove the transaction at the specific index
  transactions[replaceCrypto].splice(i, 1);
  // Delete the key if there are no transactions
  if (transactions[replaceCrypto].length === 0) delete transactions[replaceCrypto];

  req.user.transactions = transactions;
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