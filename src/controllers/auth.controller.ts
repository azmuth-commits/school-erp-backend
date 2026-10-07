import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { UserRole } from "../../generated/prisma/client.js";
import { created, success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    name: string;
    email?: string;
    mobile: string;
    password: string;
    loginId: string;
    role: keyof typeof UserRole;
    subject?: string;
  };
  const user = await authService.registerUser({ ...body, role: UserRole[body.role] });
  return created(res, user, "User registered");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { loginId, password } = req.body as { loginId: string; password: string };
  const result = await authService.login(loginId, password);
  return success(res, result, "Logged in");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { loginId } = req.body as { loginId: string };
  const result = await authService.forgotPassword(loginId);
  return success(res, result, "If the account exists, an OTP has been issued");
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { loginId, otp, newPassword } = req.body as {
    loginId: string;
    otp: string;
    newPassword: string;
  };
  const result = await authService.verifyOtpAndReset(loginId, otp, newPassword);
  return success(res, result, "Password reset successful");
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body as { refreshToken: string };
  const result = await authService.refresh(token);
  return success(res, result, "Token refreshed");
});
