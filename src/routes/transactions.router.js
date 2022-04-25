import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateParams from "../middlewares/validateParams.middleware.js";
import Big from "big.js";
import { SERVER_ERROR, TRANSACTION_NOT_FOUND, TRANSACTION_INVALID } from "../config/errors.js";
import { findTransactionByID } from "../helpers/transaction.helper.js";

const router = express.Router();

const validator = {
  crypto: {
    type: String
  },

  base: {
    type: String,
  },

  isBuy: {
    type: Boolean,
  },

  price: {
    type: String,
    validator: value => parseFloat(value) > 0 && parseFloat(value) == value
  },

  quantity: {
    type: String,
    validator: value => parseFloat(value) > 0 && parseFloat(value) == value
  },

  date: {
    type: Number,
    validator: date => date >= 0 && date <= +new Date()
  },
};

// Get all transactions
router.get("/", authMiddleware, (req, res) => {
  res.json({ success: true, transactions: req.user.transactions, msg: "Transactions retrieved successfully" });
});

// Create new transaction
router.post("/", validateParams(validator), authMiddleware, (req, res, next) => {
  const { crypto, base, isBuy, price, quantity, date, notes } = req.body;
  const transactions = req.user.transactions;

  // Check if the crypto is already in the Map
  if (crypto in transactions) {
    // If so, add the new transaction
    transactions[crypto].push({ crypto, base, isBuy, price, quantity, date, ...(notes && { notes }) });
  } else {
    // Otherwise, create key
    transactions[crypto] = [{ crypto, base, isBuy, price, quantity, date, ...(notes && { notes }) }];
  };

  // Check if the total quantity is positive
  const total = transactions[crypto].reduce(
    (prev, curr) => curr.isBuy ? prev.plus(curr.quantity) : prev.minus(curr.quantity), 
    new Big(0)
  );
  if (total.s === -1) return next(TRANSACTION_INVALID);

  req.user.transactions = transactions;
  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };
    // Return success and the new transaction id
    res.json({ success: true, id: req.user.transactions[crypto][transactions[crypto].length - 1]._id, msg: "Transaction added successfully" });
  });
});

// Update existing transaction
router.put("/", validateParams({ id: { type: String }, ...validator }), authMiddleware, (req, res, next) => {
  const { id, crypto, base, isBuy, price, quantity, date, notes } = req.body;
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

    transactions[crypto].push({ crypto, base, isBuy, price, quantity, date, ...(notes && { notes }) });
    i = transactions[crypto].length - 1;
  } else {
    transactions[crypto][i] = { crypto, base, isBuy, price, quantity, date, ...(notes && { notes }) };
  };

  // Check if the total quantity is positive (of both cryptos!)
  let total = transactions[crypto].reduce(
    (prev, curr) => curr.isBuy ? prev.plus(curr.quantity) : prev.minus(curr.quantity), 
    new Big(0)
  );
  if (total.s === -1) return next(TRANSACTION_INVALID);
  
  // The replaceCrypto transactions might be missing
  total = (transactions[replaceCrypto] || []).reduce(
    (prev, curr) => curr.isBuy ? prev.plus(curr.quantity) : prev.minus(curr.quantity), 
    new Big(0)
  );
  if (total.s === -1) return next(TRANSACTION_INVALID);

  req.user.transactions = transactions;
  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };

    res.json({ success: true, newId: req.user.transactions[crypto][i]._id, msg: "Transaction updated successfully" });
  });
});

// Delete transaction
router.delete("/", validateParams({ id: { type: String } }), authMiddleware, (req, res, next) => {
  const { id } = req.body;
  const transactions = req.user.transactions;

  const { replaceCrypto, i } = findTransactionByID(transactions, id);
  if (!replaceCrypto) return next(TRANSACTION_NOT_FOUND);

  // Remove the transaction at the specific index
  transactions[replaceCrypto].splice(i, 1);
  // Check if the balance is positive
  const total = transactions[replaceCrypto].reduce(
    (prev, curr) => curr.isBuy ? prev.plus(curr.quantity) : prev.minus(curr.quantity), 
    new Big(0)
  );
  if (total.s === -1) return next(TRANSACTION_INVALID);
  // Delete the key if there are no transactions
  if (transactions[replaceCrypto].length === 0) delete transactions[replaceCrypto];

  req.user.transactions = transactions;
  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };

    res.json({ success: true, msg: "Transaction deleted successfully" });
  });
});

// Error handler function
router.use((err, req, res, next) => {
	res.status(err.status);
	res.json({ success: false, msg: err.message });
});

export default router;