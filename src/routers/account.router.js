import express from "express";
import User from "../models/user.js";
import validateParams from "../middlewares/validateParams.middleware.js";
import rateLimit from "express-rate-limit";
import { encrypt, decrypt } from "../helpers/crypto.helper.js";
import { BASE_URL, COOKIE_OPTS, EMAIL } from "../config/config.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validateEmail, validatePassword } from "../helpers/validateParams.helper.js";
import { decodeJWT, issueJWT } from "../helpers/jwt.helper.js";
import sendMail from "../helpers/sendMail.helper.js";
import { EMAIL_REGISTERED_ERROR, EXPIRED_LINK, INVALID_PARAMETERS, EMAIL_NOT_FOUND, LIMIT_ERROR } from "../config/errors.js";

const router = express.Router();

const limiter1h = rateLimit({
  windowMs: 3600000,
  max: process.env.NODE_ENV === "test" ? 0 : 10,
  handler: LIMIT_ERROR
});
// POST - Sends email
// PUT/DELETE - Update / Delete account

// Limit api calls to 10 times per hour
router.use(limiter1h);

// Send email to delete account
router.post("/delete", authMiddleware, (req, res, next) => {
  const jwt = issueJWT(req.user, { delete: true }, { expiresIn: "1h" });
  sendMail("deleteAccount", req.user.email, EMAIL.noreply, "Delete account request", { codeLink: `${BASE_URL}/confirm?jwt=${jwt}&update=delete` });
  res.json({ success: true, msg: "Check your email to continue" });
});

// Delete account
router.delete("/delete", validateParams({ jwt: { type: String } }, { location: "query" }), (req, res, next) => {
  const jwt = decodeJWT(req.query.jwt);
  // Throw error if the jwt is invalid
  if (!jwt || !jwt.delete) return next(EXPIRED_LINK);
  User.deleteOne({ _id: jwt.sub, isVerified: true }, err => {
    if (err) return next(EXPIRED_LINK);
    res.cookie("jwt", "", COOKIE_OPTS);
    res.json({ success: true, msg: "Account deleted successfully" });
  });
});

// Send email to update account
router.post("/update", authMiddleware, async (req, res, next) => {
  // Check email format
  if (typeof req.body?.email !== "undefined") {
    if (typeof req.body.email !== "string") return next(INVALID_PARAMETERS);
    if (!validateEmail(req.body.email)) return next(INVALID_PARAMETERS);
  };

  // If the new email is already registered, send error message
  if (req.body.email) {
    if (await User.exists({ email: req.body.email })) return next(EMAIL_REGISTERED_ERROR);
  };

  const email = req.body.email || req.user.email;
  // Temporary store encrypted email in JWT to retrieve it later
  const jwt = issueJWT(req.user, { update: true, email: encrypt(email) }, { expiresIn: "1h" });
  const modifiedField = req.body.email ? "email" : "password";
  // Send email either to the current email or to the email received as optional parameter
  sendMail("updateAccount", email, EMAIL.noreply, `Update ${modifiedField} request`, { codeLink: `${BASE_URL}/confirm?jwt=${jwt}&update=${modifiedField}` });

  res.json({ success: true, msg: "Check your email to continue" });
});

// Send email to reset password (forgot password)
router.post("/forgot", validateParams({ email: { type: String, validator: validateEmail } }), async (req, res, next) => {
  const email = req.body.email;
  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) return next(EMAIL_NOT_FOUND);
  
  // Temporary store encrypted email in JWT to retrieve it later
  const jwt = issueJWT(user, { update: true, email: encrypt(email) }, { expiresIn: "1h" });
  // Send email either to the current email or to the email received as optional parameter
  sendMail("resetPassword", email, EMAIL.noreply, "Reset password request", { codeLink: `${BASE_URL}/confirm?jwt=${jwt}&update=password` });

  res.json({ success: true, msg: "Check your email to continue" });
});

// Update account
router.put("/update", (req, res, next) => {
  const jwt = decodeJWT(req.body.jwt);
  if (!jwt || !jwt.update) return next(EXPIRED_LINK);

  const password = req.body.password;
  // Check password format
  if (typeof password !== "undefined") {
    if (typeof password !== "string") return next(INVALID_PARAMETERS);
    if (!validatePassword(password)) return next(INVALID_PARAMETERS);
  };

  // Try to decrypt email
  let email;
  try { email = decrypt(jwt.email) }
  catch { return next(INVALID_PARAMETERS) };

  User.findOneAndUpdate({ _id: jwt.sub, isVerified: true }, { email, ...(password && { password }) }, (err, user) => {
    if (err) return next(EMAIL_REGISTERED_ERROR);
    if (!user) return next(EXPIRED_LINK);
    // Issue new JWT token
    res.cookie("jwt", issueJWT(user), COOKIE_OPTS);
    res.json({ success: true, msg: password ? "Password updated successfully" : "Email updated successfully"  });
  });
});

// Delete all transactions
router.delete("/delete/transactions", authMiddleware, (req, res, next) => {
  req.user.transactions = [];
  req.user.save(err => {
    if (err) throw err;
    res.json({ success: true, msg: "Transactions deleted successfully" });
  });
});

// Send feedback via email
router.post("/feedback", validateParams({ msg: { type: String } }), authMiddleware, (req, res, next) => {
  sendMail("feedback", EMAIL.contact, EMAIL.noreply, "Feedback", { msg: req.body.msg, from: req.user.email });
  res.json({ success: true, msg: "Feedback successfully sent" });
});

export default router;