import { existsSync, statSync } from "fs";
import { CRYTPO_INFO_FILE, CRYPTO_INFO_REFRESH_TIME } from "../config/config.js";

export default function() {
  if (!existsSync(CRYTPO_INFO_FILE)) return false;
  const { birthtimeMs } = statSync(CRYTPO_INFO_FILE);
  return +new Date() - birthtimeMs <= CRYPTO_INFO_REFRESH_TIME;
}