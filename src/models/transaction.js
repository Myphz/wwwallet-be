import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  isBuy: {
    type: Boolean,
    required: true
  },

  pair: {
    type: String,
    required: true
  },

  price: {
    type: mongoose.Decimal128,
    required: true
  },

  quantity: {
    type: mongoose.Decimal128,
    required: true
  },

  date: {
    type: Number,
    required: true
  },
});

export default TransactionSchema;