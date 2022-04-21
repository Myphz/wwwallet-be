import passport from "passport";
import { Strategy } from "passport-jwt";
import User from "../models/user";
import { JWT_KEY } from "../config/config";

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
const authStratregy = new Strategy(opts, (jwtToken, cb) => {
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
export default passport.authenticate('jwt', { session: false, failWithError: true });