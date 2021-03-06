import express from "express";
import User from "../models/user.js";
import rateLimit from "express-rate-limit";
import { issueJWT, decodeJWT } from "../helpers/jwt.helper.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { BASE_URL, EMAIL } from "../config/config.js";
import setJWTCookie from "../helpers/cookie.helper.js";
import validateParams from "../middlewares/validateParams.middleware.js";
import { CREDENTIALS_ERROR, EMAIL_REGISTERED_ERROR, EXPIRED_LINK, LIMIT_ERROR } from "../config/errors.js";
import { validateEmail, validatePassword } from "../helpers/validateParams.helper.js";
import { logInfo } from "../helpers/logger.helper.js";
import sendMail from "../helpers/sendMail.helper.js";

const router = express.Router();

const validator = {
  email: {
    type: String,
    validator: validateEmail
  },

  password: {
    type: String,
    validator: validatePassword
  }
};

const limiter1h = rateLimit({
  windowMs: 3600000,
  max: process.env.NODE_ENV === "test" ? 0 : 5,
  handler: LIMIT_ERROR
});

// Register endpoint
// This method can be called with the request parameter "resend" to just resend the email, without
// creating a new user.
router.post("/register", limiter1h, validateParams(validator), (req, res, next) => {
  const { email, password, resend } = req.body;
  if (resend) {
    // Don't create a new user, just verify that the user exists, create the jwt token and send the email
    return User.checkLogin(email, password, { isVerified: false }).then(({ login, user }) => {
      if (!login) return next(CREDENTIALS_ERROR);
      const jwt = issueJWT(user);
      sendMail("confirmEmail", email, EMAIL.noreply, "Confirm your email address", { codeLink: `${BASE_URL}/register/verify?jwt=${jwt}` });
      // Return success
      return res.json({ success: true, msg: "Email sent successfully" });
    })
    // If an error occured, the email isn't registered
    .catch(() => next(CREDENTIALS_ERROR));
  };
  
  // Create new user and try to save it
  const user = new User({ email, password });
  user.save((err, user) => {
    // If an error has occurred, the email is already registered
    if (err) return next(EMAIL_REGISTERED_ERROR);
    // Save the jwt token and send verification email with the jwt token
    const jwt = issueJWT(user);
    sendMail("confirmEmail", email, EMAIL.noreply, "Confirm your email address", { codeLink: `${BASE_URL}/register/verify?jwt=${jwt}` });
    // Return success
    res.json({ success: true });
    logInfo("A new user has registered!");
  });
});

// Confirm email endpoint
router.post("/register/verify", validateParams({ jwt: { type: String } }), (req, res, next) => {
  const jwt = decodeJWT(req.body.jwt);
  // Throw error if the jwt is invalid
  if (!jwt) return next(EXPIRED_LINK);
  // Find and update the user
  User.findOneAndUpdate({ _id: jwt.sub, isVerified: false }, { isVerified: true }, (err, user) => {
    // If an error occured, the jwt cookie is not valid (i.e, the account has been deleted as more than 24 hours have passed or the jwt is invalid)
    if (err || !user) return next(EXPIRED_LINK);
    setJWTCookie(req.body.jwt, req, res);
    res.json({ success: true, msg: "Email successfully verified" });
    logInfo("A new user has verified their account!");
  });
});

// Login endpoint
router.post("/login", validateParams(validator, { error: CREDENTIALS_ERROR }), (req, res, next) => {
  // If any field is missing, return error
  const { email, password } = req.body;
  User.checkLogin(email, password)
    // If the email has been found, check if the password match with the login parameter
    .then(({ login, user }) => {
      if (!login) return next(CREDENTIALS_ERROR);
      // If the password match and the user is verified, issue the jwt token
      if (user.isVerified) setJWTCookie(issueJWT(user), req, res);
      // Return success and isVerified property
      res.json({ success: true, isVerified: user.isVerified });
    })
    // If an error occured, the email isn't registered
    .catch(() => next(CREDENTIALS_ERROR));
});

// Logout the user (replace the jwt cookie and return success)
router.delete("/login", (req, res) => {
  setJWTCookie("", req, res);
  res.json({ success: true });
});

// Verify a user (already using the middleware, so just return success)
router.get("/verify", authMiddleware, (req, res) => {
  res.json({ success: true });
});

// Error handler function
router.use((err, req, res, next) => {
  // Set empty jwt token as cookie
  setJWTCookie("", req, res);
  next(err);
});

export default router;