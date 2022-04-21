const express = require("express");
const User = require("../models/user");
const issueJWT = require("../helpers/issueJWT.helper");
const authMiddleware = require("../middlewares/auth.middleware");
const { COOKIE_OPTS } = require("../config/config");
const validateParams = require("../middlewares/validateParams.middleware");
const { CREDENTIALS_ERROR, EMAIL_REGISTERED_ERROR } = require("../config/errors");
const router = express.Router();

// Register endpoint
router.post("/register", validateParams, (req, res, next) => {
	const { email, password } = req.body;
  // Create new user and try to save it
	const user = new User({ email, password });
	user.save((err, user) => {
    // If an error has occurred, the email is already registered
		if (err) return next(EMAIL_REGISTERED_ERROR);
    // Set jwt token and return success
		res.cookie("jwt", issueJWT(user), COOKIE_OPTS);
		res.json({ success: true });
	});
});

// Login endpoint
router.post("/login", validateParams, (req, res, next) => {
  // If any field is missing, return error
	const { email, password } = req.body;
	User.checkLogin(email, password)
    // If the email has been found, check if the password match with the login parameter
		.then(({ login, user }) => {
			if (!login) return next(CREDENTIALS_ERROR);
      // If the password match, issue the jwt token and return success
			res.cookie("jwt", issueJWT(user), COOKIE_OPTS);
			res.json({ success: true });
		})
    // If an error occured, the email isn't registered
		.catch(_ => {
			return next(CREDENTIALS_ERROR);
		});
});

// Logout the user (replace the jwt cookie and return success)
router.delete("/login", (req, res) => {
	res.cookie("jwt", "", COOKIE_OPTS);
	res.json({ success: true });
});

// Verify a user (already using the middleware, so just return success)
router.get("/verify", authMiddleware, (req, res) => {
	res.json({ success: true });
});

// Error handler function
router.use((err, req, res, next) => {
  // Set empty jwt token as cookie
  res.cookie("jwt", "", COOKIE_OPTS);
	res.status(err.status);
	res.json({ success: false, msg: err.message });
});

module.exports = router;