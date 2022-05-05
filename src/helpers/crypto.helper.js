import crypto from "crypto";
import { JWT_KEY } from "../config/config.js";

const algo = "aes-256-cbc";
// Use the digest of the SHA256 hash function of the JWT KEY as key for the AES algorithm
const key = crypto.createHash("sha256").update(JWT_KEY).digest();

export function encrypt(data) {
  if (!data) return data;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algo, key, iv);
  let ret = cipher.update(data);
  ret = Buffer.concat([ret, cipher.final()]);
  return { iv: iv.toString("binary"), ret: ret.toString("binary") };
};

export function decrypt(data) {
  if (!data) return data;
  const { iv, ret } = data;
  const salt = Buffer.from(iv, "binary");
  const encrypted = Buffer.from(ret, "binary");

  const decipher = crypto.createDecipheriv(algo, key, salt);
  let decyphered = decipher.update(encrypted);
  decyphered = Buffer.concat([decyphered, decipher.final()]);
  return decyphered.toString(); 
};