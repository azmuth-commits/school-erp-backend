import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  verifyOtpSchema,
} from "../validators/auth.schema.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.post(
  "/register",
  authenticate,
  authorize("ADMIN"),
  validateBody(registerSchema),
  authController.register,
);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-otp", authLimiter, validateBody(verifyOtpSchema), authController.verifyOtp);
router.post("/refresh-token", validateBody(refreshTokenSchema), authController.refreshToken);

export default router;
