const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const User = require("mongoose").model("User");
const { JWT_KEY } = require("../config/config");

// Retrieves the JWT token from cookies
const jwtFromRequest = req => {
  return req?.cookies?.jwt || null; 
};

// Options for the strategy
const opts = { 
  jwtFromRequest,
  secretOrKey: JWT_KEY 
};

// Check if the user exists, given its id
const authStratregy = new JwtStrategy(opts, (jwtToken, cb) => {
  User.findById(jwtToken.sub, (err, user) => {
    // Error + no user
    if (err) return cb(err, false);
    // No error + user
    if (user) return cb(null, user);
    // No error + no user
    return cb(null, false);
  });
});

passport.use(authStratregy);
module.exports = passport.authenticate('jwt', { session: false, failWithError: true });