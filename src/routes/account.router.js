import express from "express";
import validateParams from "../middlewares/validateParams.middleware.js";
import { BASE_URL, COOKIE_OPTS, EMAIL } from "../config/config.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validateEmail, validatePassword } from "../helpers/validateParams.helper.js";
import { decodeJWT, issueJWT } from "../helpers/jwt.helper.js";
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

// POST - Sends email
// PUT/DELETE - Modified / Delete account

// Send email to delete account
router.post("/delete", authMiddleware, (req, res, next) => {
  const jwt = issueJWT(req.user, { delete: true });
  sendMail("deleteAccount", req.user.email, EMAIL.noreply, "Delete account request", { codeLink: `${BASE_URL}account/delete?jwt=${jwt}` });
  res.json({ success: true });
});

// Delete account
router.delete("/delete", validateParams({ jwt: { type: String } }, { location: "query" }), (req, res, next) => {
  const jwt = decodeJWT(req.query.jwt);
  // Throw error if the jwt is invalid
  if (!jwt) return next(CREDENTIALS_ERROR);
  console.log(jwt);
});

// Error handler function
// router.use((err, req, res, next) => {
//   // Set empty jwt token as cookie
//   res.cookie("jwt", "", COOKIE_OPTS);
//   res.status(err.status);
//   res.json({ success: false, msg: err.message });
// });

export default router;
