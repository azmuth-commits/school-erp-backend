import bcrypt from "bcrypt";
import crypto from "node:crypto";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  return crypto.randomInt(0, max).toString().padStart(length, "0");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
