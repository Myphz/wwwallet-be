import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateParams from "../middlewares/validateParams.middleware.js";
import { SERVER_ERROR } from "../config/errors.js";

const router = express.Router();

const validator = {
  isBuy: {
    type: Boolean,
  },

  pair: {
    type: String,
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

router.post("/", authMiddleware, validateParams(validator), (req, res, next) => {
  const { isBuy, pair, price, quantity, date } = req.body;
  req.user.transactions.push({ isBuy, pair, price, quantity, date });
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