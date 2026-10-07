import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthUser } from "../types/index.js";

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET is not set");
  }
  return value;
}

export function signAccessToken(payload: AuthUser): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret(), options);
}

export function signRefreshToken(payload: { userId: string; tokenId: string }): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "30d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret(), options);
}

export function verifyToken<T>(token: string): T {
  return jwt.verify(token, secret()) as T;
}

export function refreshExpiryDate(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}
