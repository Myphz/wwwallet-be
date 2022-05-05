import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config/config.js";

// Function to sign a jwt token, given the user
export function issueJWT(user, opts) {
  const payload = {
      sub: user._id,
      ...(opts || {})
  };

  return jwt.sign(payload, JWT_KEY);
}

export function decodeJWT(jwtToken) {
  if (!jwtToken) return;
  return jwt.verify(jwtToken, JWT_KEY, (err, decoded) => {
    if (err) return;
    return decoded;
  });
}