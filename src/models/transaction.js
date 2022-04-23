import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  base: {
    type: String,
    required: true
  },

  isBuy: {
    type: Boolean,
    required: true
  },

  price: {
    type: mongoose.Decimal128,
    required: true,
  },

  quantity: {
    type: mongoose.Decimal128,
    required: true
  },

  date: {
    type: Number,
    required: true
  },

  notes: {
    type: String
  }
});

export default TransactionSchema;