import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../config/jwt.js";
import { prisma } from "../config/database.js";
import type { AuthUser } from "../types/index.js";
import { AppError } from "../utils/apiResponse.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyToken<AuthUser>(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { teacher: true, parent: true },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.user = {
      userId: user.id,
      role: user.role,
      loginId: user.loginId,
      teacherId: user.teacher?.id,
      parentId: user.parent?.id,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Invalid or expired token", 401));
  }
}
