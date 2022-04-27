import { promises as fs } from "fs";
import { CRYTPO_INFO_FILE, CRYPTO_INFO_REFRESH_TIME } from "../config/config.js";

export default async function() {
  try {
    const { mtimeMs } = await fs.stat(CRYTPO_INFO_FILE);
    return +new Date() - mtimeMs <= CRYPTO_INFO_REFRESH_TIME;
  } catch {
    return false;
  }
}