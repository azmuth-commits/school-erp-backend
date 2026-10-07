import { z } from "zod";

export const markAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string(),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: z.enum(["PRESENT", "ABSENT", "HOLIDAY", "LATE"]),
        notes: z.string().optional(),
        subject: z.string().optional(),
      }),
    )
    .min(1),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "HOLIDAY", "LATE"]).optional(),
  notes: z.string().optional(),
  subject: z.string().optional(),
});

export const createHomeworkSchema = z.object({
  classId: z.string().uuid(),
  subject: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string(),
});

export const updateHomeworkSchema = z.object({
  subject: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().optional(),
});

export const createReportCardSchema = z.object({
  studentId: z.string().uuid(),
  exam: z.string().min(1),
  date: z.string(),
  overallPercentage: z.coerce.number().min(0).max(100),
  grade: z.string().min(1),
});

export const updateReportCardSchema = z.object({
  exam: z.string().min(1).optional(),
  date: z.string().optional(),
  overallPercentage: z.number().min(0).max(100).optional(),
  grade: z.string().min(1).optional(),
});

export const createNotificationSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string(),
  type: z.enum(["GENERAL", "EVENT", "URGENT"]),
  targetClass: z.string().optional(),
});

export const createElearningSchema = z.object({
  classId: z.string().uuid(),
  subject: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});
