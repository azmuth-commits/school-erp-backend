import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/apiResponse.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found", data: null });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, data: null });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      data: null,
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  const status = message.toLowerCase().includes("required") || message.toLowerCase().includes("must be")
    ? 400
    : 500;

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(status).json({ success: false, message, data: null });
}
