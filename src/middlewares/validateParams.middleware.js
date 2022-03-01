const { INVALID_PARAMETERS, MISSING_PARAMETERS } = require("../config/errors");
const { validateEmail, validatePassword } = require("../helpers/validateParams.helper");

module.exports = (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) return next(MISSING_PARAMETERS);
  const { email, password } = req.body;
  if (!validateEmail(email) || !validatePassword(password)) return next(INVALID_PARAMETERS);
  next();
}