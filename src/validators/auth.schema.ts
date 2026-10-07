import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email().optional(),
  mobile: z.string().min(10),
  password: z.string().min(8),
  loginId: z.string().min(3),
  role: z.enum(["ADMIN", "TEACHER", "PARENT"]),
  subject: z.string().optional(),
});

export const loginSchema = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  loginId: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  loginId: z.string().min(1),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});
