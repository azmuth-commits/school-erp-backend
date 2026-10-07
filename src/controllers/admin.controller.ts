import type { Request, Response } from "express";
import * as studentService from "../services/student.service.js";
import * as schoolService from "../services/school.service.js";
import { created, success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/apiResponse.js";

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.createStudentWithParent(req.body);
  return created(res, student, "Student created");
});

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const result = await studentService.listStudents(page, limit, search);
  return success(res, result);
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.getStudent(req.params.id!);
  return success(res, student);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.updateStudent(req.params.id!, req.body);
  return success(res, student, "Student updated");
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  await studentService.deleteStudent(req.params.id!);
  return success(res, null, "Student deleted");
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const row = await schoolService.createClass(req.body.grade, req.body.section);
  return created(res, row, "Class created");
});

export const listClasses = asyncHandler(async (_req: Request, res: Response) => {
  return success(res, await schoolService.listClasses());
});

export const assignClassTeacher = asyncHandler(async (req: Request, res: Response) => {
  const row = await schoolService.assignClassTeacher(req.params.id!, req.body.teacherId);
  return success(res, row, "Class teacher assigned");
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.deleteClass(req.params.id!);
  return success(res, null, "Class deleted");
});

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await schoolService.createTeacher(req.body);
  return created(res, teacher, "Teacher created");
});

export const listTeachers = asyncHandler(async (_req: Request, res: Response) => {
  return success(res, await schoolService.listTeachers());
});

export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await schoolService.updateTeacher(req.params.id!, req.body);
  return success(res, teacher, "Teacher updated");
});

export const assignTeacherClass = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await schoolService.assignTeacherToClass(req.params.id!, req.body.classId);
  return success(res, assignment, "Teacher assigned to class");
});

export const removeTeacherClass = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.removeTeacherFromClass(req.params.id!, req.params.classId!);
  return success(res, null, "Teacher removed from class");
});

export const createTimetable = asyncHandler(async (req: Request, res: Response) => {
  const entry = await schoolService.createTimetableEntry(req.body);
  return created(res, entry, "Timetable entry created");
});

export const getClassTimetable = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await schoolService.getClassTimetable(req.params.classId!));
});

export const updateTimetable = asyncHandler(async (req: Request, res: Response) => {
  const entry = await schoolService.updateTimetable(req.params.id!, req.body);
  return success(res, entry, "Timetable updated");
});

export const deleteTimetable = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.deleteTimetable(req.params.id!);
  return success(res, null, "Timetable entry deleted");
});

export const createFee = asyncHandler(async (req: Request, res: Response) => {
  const fee = await schoolService.createFee(req.body);
  return created(res, fee, "Fee created");
});

export const getStudentFees = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await schoolService.getStudentFees(req.params.studentId!));
});

export const updateFee = asyncHandler(async (req: Request, res: Response) => {
  const fee = await schoolService.updateFee(req.params.id!, req.body);
  return success(res, fee, "Fee updated");
});

export const deleteFee = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.deleteFee(req.params.id!);
  return success(res, null, "Fee deleted");
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const row = await schoolService.createAnnouncement({
    ...req.body,
    createdBy: req.user.userId,
  });
  return created(res, row, "Announcement created");
});

export const listAnnouncements = asyncHandler(async (_req: Request, res: Response) => {
  return success(res, await schoolService.listAnnouncements());
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const row = await schoolService.updateAnnouncement(req.params.id!, req.body);
  return success(res, row, "Announcement updated");
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.deleteAnnouncement(req.params.id!);
  return success(res, null, "Announcement deleted");
});
