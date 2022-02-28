const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { SALT_ROUNDS } = require('../config/config');

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

  // TODO: Add preferences, transactionID
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
    this.findOne( { email }, { _id: 1, password: 1 }, (err, user) => {
      if (err || !user) 
        reject({ login: false, user: null });
      else
        resolve({ login: bcrypt.compareSync(password, user.password), user });
    });
  });
}

module.exports = mongoose.model("User", UserSchema);


