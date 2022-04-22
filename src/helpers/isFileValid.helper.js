import fs from "fs";
import { CRYTPO_INFO_FILE, CRYPTO_INFO_REFRESH_TIME } from "../config/config.js";

export default function() {
  if (!fs.existsSync(CRYTPO_INFO_FILE)) return false;
  const { birthtimeMs } = fs.statSync(CRYTPO_INFO_FILE);
  return +new Date() - birthtimeMs <= CRYPTO_INFO_REFRESH_TIME;
}