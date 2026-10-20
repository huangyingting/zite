import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, keyHex] = parts;
  const expectedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scryptAsync(password, salt, expectedKey.length)) as Buffer;

  if (expectedKey.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedKey, derivedKey);
}
