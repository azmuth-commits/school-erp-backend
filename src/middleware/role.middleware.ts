import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../generated/prisma/client.js";
import { AppError } from "../utils/apiResponse.js";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError("Insufficient permissions", 403));
      return;
    }
    next();
  };
}
