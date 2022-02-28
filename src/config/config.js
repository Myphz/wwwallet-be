require("dotenv").config();

module.exports = {
  PORT: 3000,
  JWT_KEY: process.env.JWT_KEY,
  DB_STRING: process.env.DB_TEST || process.env.DB_STRING,
  SALT_ROUNDS: 10,
  COOKIE_OPTS: {
    secure: true,
    httpOnly: true,
    overwrite: true
  }
};