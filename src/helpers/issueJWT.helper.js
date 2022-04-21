import jwt from "jsonwebtoken";
import { JWT_KEY } from "../config/config.js";

// Function to sign a jwt token, given the user
export default function(user) {
  const payload = {
      sub: user._id,
  };

  return jwt.sign(payload, JWT_KEY);
}