import { COOKIE_OPTS } from "../config/config.js";

export default function(jwt, req, res) {
  // Set sameSite to None for android
  res.cookie("jwt", jwt, { ...COOKIE_OPTS, ...(req.get("android") && { sameSite: "None" }) });
}