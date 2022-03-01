const { INVALID_PARAMETERS, MISSING_PARAMETERS } = require("../config/errors");

function validateEmail(email) {
  const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
};

function validatePassword(password) {
  return password.length > 6; // TODO: Define password constraints
};

module.exports = (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) return next(MISSING_PARAMETERS);
  const { email, password } = req.body;
  if (!validateEmail(email) || !validatePassword(password)) return next(INVALID_PARAMETERS);
  next();
}