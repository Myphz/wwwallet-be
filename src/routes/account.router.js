import express from "express";
import User from "../models/user.js";
import validateParams from "../middlewares/validateParams.middleware.js";
import { BASE_URL, COOKIE_OPTS, EMAIL } from "../config/config.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validateEmail, validatePassword } from "../helpers/validateParams.helper.js";
import { decodeJWT, issueJWT } from "../helpers/jwt.helper.js";
import sendMail from "../helpers/sendMail.helper.js";
import { EMAIL_REGISTERED_ERROR, EXPIRED_LINK, INVALID_PARAMETERS, SERVER_ERROR } from "../config/errors.js";

const router = express.Router();

// POST - Sends email
// PUT/DELETE - Update / Delete account

// Send email to delete account
router.post("/delete", authMiddleware, (req, res, next) => {
  const jwt = issueJWT(req.user, { delete: true }, { expiresIn: "1d" });
  sendMail("deleteAccount", req.user.email, EMAIL.noreply, "Delete account request", { codeLink: `${BASE_URL}account/delete?jwt=${jwt}` });
  res.json({ success: true });
});

// Delete account
router.delete("/delete", validateParams({ jwt: { type: String } }, { location: "query" }), (req, res, next) => {
  const jwt = decodeJWT(req.query.jwt);
  // Throw error if the jwt is invalid
  if (!jwt || !jwt.delete) return next(EXPIRED_LINK);
  User.deleteOne({ _id: jwt.sub, isVerified: true }, err => {
    if (err) return next(EXPIRED_LINK);
    res.cookie("jwt", "", COOKIE_OPTS);
    res.json({ success: true });
  });
});

// Send email to update account
router.post("/update", authMiddleware, (req, res, next) => {
  // Check email format
  if (req.body.email && !validateEmail(req.body.email)) return next(INVALID_PARAMETERS);
  // Store email in JWT to retrieve it later
  const jwt = issueJWT(req.user, { update: true, email: req.body.email }, { expiresIn: "1d" });
  // Send email either to the current email or to the email received as optional parameter
  sendMail("updateAccount", req.body.email || req.user.email, EMAIL.noreply, "update account request", { codeLink: `${BASE_URL}account/update?jwt=${jwt}` });
  res.json({ success: true });
});

// Update account
router.put("/update", (req, res, next) => {
  const jwt = decodeJWT(req.body.jwt);
  if (!jwt || !jwt.update) return next(EXPIRED_LINK);

  const { password } = req.body;
  // Check password format
  if (password && !validatePassword(password)) return next(INVALID_PARAMETERS);
  const { email } = jwt;

  User.findOneAndUpdate({ _id: jwt.sub, isVerified: true }, { ...(email && { email }), ...(password && { password }) }, (err, user) => {
    if (err) return next(EMAIL_REGISTERED_ERROR);
    if (!user) return next(EXPIRED_LINK);
    res.cookie("jwt", issueJWT(user), COOKIE_OPTS);
    res.json({ success: true, msg: "Account updated successfully" });
  });
});

// Delete all transactions
router.delete("/delete/transactions", authMiddleware, (req, res, next) => {
  req.user.transactions = [];
  req.user.save(err => {
    if (err) {
      console.log(err);
      // This should never fail, so send a generic 500 response
      return next(SERVER_ERROR);
    };

    res.json({ success: true, msg: "All transactions deleted successfully" });
  });
});

// Error handler function
router.use((err, req, res, next) => {
  // Set empty jwt token as cookie
  res.cookie("jwt", "", COOKIE_OPTS);
  res.status(err.status);
  res.json({ success: false, msg: err.message });
});

export default router;
