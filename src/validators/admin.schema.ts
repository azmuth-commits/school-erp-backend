import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(2),
  rollNumber: z.string().min(1),
  classId: z.string().uuid(),
  avatar: z.string().optional(),
  parent: z.object({
    name: z.string().min(2),
    mobile: z.string().min(10),
    email: z.email().optional(),
    loginId: z.string().min(3),
    password: z.string().min(8),
  }),
});

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  rollNumber: z.string().min(1).optional(),
  classId: z.string().uuid().optional(),
  avatar: z.string().optional(),
});

export const createClassSchema = z.object({
  grade: z.string().min(1),
  section: z.string().min(1),
});

export const assignTeacherSchema = z.object({
  teacherId: z.string().uuid(),
});

export const createTeacherSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.email().optional(),
  loginId: z.string().min(3),
  password: z.string().min(8),
  subject: z.string().optional(),
});

export const updateTeacherSchema = z.object({
  name: z.string().min(2).optional(),
  mobile: z.string().min(10).optional(),
  email: z.email().optional(),
  subject: z.string().optional(),
});

export const assignClassSchema = z.object({
  classId: z.string().uuid(),
});

export const createTimetableSchema = z.object({
  classId: z.string().uuid(),
  day: z.string().min(3),
  period: z.number().int().positive(),
  time: z.string().min(1),
  subject: z.string().min(1),
  teacherId: z.string().uuid().optional(),
});

export const updateTimetableSchema = z.object({
  day: z.string().min(3).optional(),
  period: z.number().int().positive().optional(),
  time: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  teacherId: z.string().uuid().nullable().optional(),
});

export const createFeeSchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(["QUARTERLY", "TRANSPORT", "EXAM", "OTHER"]),
  amount: z.number().positive(),
  dueDate: z.string(),
  description: z.string().min(1),
});

export const updateFeeSchema = z.object({
  type: z.enum(["QUARTERLY", "TRANSPORT", "EXAM", "OTHER"]).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
  description: z.string().min(1).optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string(),
  type: z.enum(["GENERAL", "EVENT", "URGENT"]),
  targetClass: z.string().optional(),
});
