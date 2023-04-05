import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config/config.js";

// Function to sign a jwt token, given the user
export function issueJWT(user, fields, opts) {
  const payload = {
    sub: user._id,
    ...(fields || {}),
  };

  return jwt.sign(payload, JWT_KEY, {
    expiresIn: "100d",
    ...(opts || {}),
  });
}

export function decodeJWT(jwtToken) {
  if (!jwtToken) return;
  return jwt.verify(jwtToken, JWT_KEY, (err, decoded) => {
    if (err) return;
    return decoded;
  });
}
