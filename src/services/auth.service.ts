import { UserRole } from "../../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { refreshExpiryDate, signAccessToken, signRefreshToken, verifyToken } from "../config/jwt.js";
import { AppError } from "../utils/apiResponse.js";
import { comparePassword, generateOtp, hashPassword, sha256 } from "../utils/password.util.js";

function publicUser(user: {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  loginId: string;
  role: UserRole;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    loginId: user.loginId,
    role: user.role.toLowerCase(),
  };
}

async function issueTokens(user: {
  id: string;
  loginId: string;
  role: UserRole;
  teacher?: { id: string } | null;
  parent?: { id: string } | null;
}) {
  const accessToken = signAccessToken({
    userId: user.id,
    loginId: user.loginId,
    role: user.role,
    teacherId: user.teacher?.id,
    parentId: user.parent?.id,
  });

  const refreshRow = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: "pending",
      expiresAt: refreshExpiryDate(),
    },
  });

  const refreshToken = signRefreshToken({ userId: user.id, tokenId: refreshRow.id });
  await prisma.refreshToken.update({
    where: { id: refreshRow.id },
    data: { tokenHash: sha256(refreshToken) },
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: {
  name: string;
  email?: string;
  mobile: string;
  password: string;
  loginId: string;
  role: UserRole;
  subject?: string;
}) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { loginId: input.loginId },
        { mobile: input.mobile },
        ...(input.email ? [{ email: input.email }] : []),
      ],
    },
  });
  if (existing) {
    throw new AppError("User with this loginId, mobile, or email already exists", 409);
  }

  const password = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      password,
      loginId: input.loginId,
      role: input.role,
      teacher:
        input.role === UserRole.TEACHER
          ? { create: { subject: input.subject } }
          : undefined,
      parent: input.role === UserRole.PARENT ? { create: {} } : undefined,
    },
    include: { teacher: true, parent: true },
  });

  return publicUser(user);
}

export async function login(loginId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { loginId },
    include: { teacher: true, parent: true },
  });
  if (!user) {
    throw new AppError("Invalid login credentials", 401);
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    throw new AppError("Invalid login credentials", 401);
  }

  const tokens = await issueTokens(user);
  return {
    user: publicUser(user),
    teacherId: user.teacher?.id ?? null,
    parentId: user.parent?.id ?? null,
    ...tokens,
  };
}

export async function forgotPassword(loginId: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ loginId }, { mobile: loginId }] },
  });
  if (!user) {
    return { sent: true };
  }

  const otp = generateOtp();
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES ?? 10);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      otpHash: sha256(otp),
      expiresAt: new Date(Date.now() + minutes * 60 * 1000),
    },
  });

  const payload: { sent: true; otp?: string; expiresInMinutes: number } = {
    sent: true,
    expiresInMinutes: minutes,
  };
  if (process.env.NODE_ENV !== "production") {
    payload.otp = otp;
  }
  return payload;
}

export async function verifyOtpAndReset(loginId: string, otp: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ loginId }, { mobile: loginId }] },
  });
  if (!user) {
    throw new AppError("Invalid OTP", 400);
  }

  const reset = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      used: false,
      otpHash: sha256(otp),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!reset) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const hashed = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    }),
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    }),
  ]);

  return { reset: true };
}

export async function refresh(refreshToken: string) {
  let payload: { userId: string; tokenId: string };
  try {
    payload = verifyToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
  if (!stored || stored.revoked || stored.userId !== payload.userId) {
    throw new AppError("Invalid refresh token", 401);
  }
  if (stored.expiresAt < new Date() || stored.tokenHash !== sha256(refreshToken)) {
    throw new AppError("Invalid refresh token", 401);
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { teacher: true, parent: true },
  });
  if (!user) {
    throw new AppError("User not found", 401);
  }

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}
