const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../config/config');

// Function to sign a jwt token, given the user
module.exports = user => {
  const payload = {
      sub: user._id,
  };

  return jwt.sign(payload, JWT_KEY);
}