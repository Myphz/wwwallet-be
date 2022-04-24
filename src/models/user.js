import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../config/config.js";
import Transaction from "./transaction.js";
import { getTransactions } from "../helpers/transaction.helper.js";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: { unique: true },
  },

  password: {
    type: String,
    required: true,
  },
  
  // Check if the email has been verified
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Save transactions as a Map with variable keys
  // Example of transactions:

  // {
  //   "BTC": {
  //     [
  //       quote: "USDC",
  //       isBuy: true,
  //       price: 239822.22,
  //       quantity: 0.12,
  //       date: 353453453
  //     ]
  //   },
  //  "ETH": { ... }
  // }
  
  transactions: {
    type: Map,
    of: [Transaction],
    default: new Map(),
    get: getTransactions,
  }
});

// Middleware that gets called before a user is saved to hash the password
UserSchema.pre("save", async function(next) {
  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
  } catch (err) {
    next(err);
  }
});

// Helper function that checks login password credentials
UserSchema.statics.checkLogin = function(email, password) {
  return new Promise((resolve, reject) => {
    this.findOne( { email }, { _id: 1, password: 1 }, async (err, user) => {
      if (err || !user) 
        reject({ login: false, user: null });
      else
        
        resolve({ login: await bcrypt.compare(password, user.password), user });
    });
  });
}

export default mongoose.model("User", UserSchema);