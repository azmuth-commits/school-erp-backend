import type { UserRole } from "../../generated/prisma/client.js";

export interface AuthUser {
  userId: string;
  role: UserRole;
  loginId: string;
  teacherId?: string;
  parentId?: string;
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface UploadedFileMeta {
  url: string;
  key: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
