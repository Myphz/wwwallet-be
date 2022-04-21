import { INVALID_PARAMETERS, MISSING_PARAMETERS } from "../config/errors";
import { validateEmail, validatePassword } from "../helpers/validateParams.helper";

export default function(req, res, next) {
  if (!req.body || !req.body.email || !req.body.password) return next(MISSING_PARAMETERS);
  const { email, password } = req.body;
  if (!validateEmail(email) || !validatePassword(password)) return next(INVALID_PARAMETERS);
  next();
}