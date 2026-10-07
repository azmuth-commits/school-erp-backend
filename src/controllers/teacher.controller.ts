import type { Request, Response } from "express";
import * as attendanceService from "../services/attendance.service.js";
import * as homeworkService from "../services/homework.service.js";
import * as reportcardService from "../services/reportcard.service.js";
import * as schoolService from "../services/school.service.js";
import { AppError, created, success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function teacherId(req: Request): string {
  if (!req.user?.teacherId) {
    throw new AppError("Teacher profile not found", 403);
  }
  return req.user.teacherId;
}

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const id = teacherId(req);
  await attendanceService.assertTeacherCanAccessClass(id, req.body.classId);
  const records = await attendanceService.markAttendance({
    ...req.body,
    markedBy: id,
  });
  return created(res, records, "Attendance marked");
});

export const getClassAttendance = asyncHandler(async (req: Request, res: Response) => {
  await attendanceService.assertTeacherCanAccessClass(teacherId(req), req.params.classId!);
  return success(res, await attendanceService.getClassAttendance(req.params.classId!, req.params.date!));
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await attendanceService.getStudentAttendance(req.params.studentId!));
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await attendanceService.updateAttendance(req.params.id!, req.body), "Attendance updated");
});

export const createHomework = asyncHandler(async (req: Request, res: Response) => {
  const id = teacherId(req);
  await attendanceService.assertTeacherCanAccessClass(id, req.body.classId);
  const homework = await homeworkService.assignHomework({ ...req.body, assignedBy: id });
  return created(res, homework, "Homework assigned");
});

export const getClassHomework = asyncHandler(async (req: Request, res: Response) => {
  await attendanceService.assertTeacherCanAccessClass(teacherId(req), req.params.classId!);
  return success(res, await homeworkService.getHomeworkForClass(req.params.classId!));
});

export const getAssignedHomework = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await homeworkService.getHomeworkAssignedBy(teacherId(req)));
});

export const updateHomework = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await homeworkService.updateHomework(req.params.id!, req.body), "Homework updated");
});

export const deleteHomework = asyncHandler(async (req: Request, res: Response) => {
  await homeworkService.deleteHomework(req.params.id!);
  return success(res, null, "Homework deleted");
});

export const createReportCard = asyncHandler(async (req: Request, res: Response) => {
  const card = await reportcardService.createReportCard({
    studentId: String(req.body.studentId),
    exam: String(req.body.exam),
    date: String(req.body.date),
    overallPercentage: Number(req.body.overallPercentage),
    grade: String(req.body.grade),
    generatedBy: teacherId(req),
    file: req.file,
  });
  return created(res, card, "Report card published");
});

export const getStudentReportCards = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await reportcardService.getStudentReportCards(req.params.studentId!));
});

export const getClassReportCards = asyncHandler(async (req: Request, res: Response) => {
  await attendanceService.assertTeacherCanAccessClass(teacherId(req), req.params.classId!);
  return success(res, await reportcardService.getClassReportCards(req.params.classId!, req.params.exam!));
});

export const updateReportCard = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await reportcardService.updateReportCard(req.params.id!, req.body), "Report card updated");
});

export const publishNotification = asyncHandler(async (req: Request, res: Response) => {
  const row = await schoolService.createAnnouncement({
    ...req.body,
    createdBy: req.user!.userId,
  });
  return created(res, row, "Notification published");
});

export const listTeacherNotifications = asyncHandler(async (req: Request, res: Response) => {
  return success(res, await schoolService.listAnnouncements({ createdBy: req.user!.userId }));
});

export const uploadElearning = asyncHandler(async (req: Request, res: Response) => {
  const id = teacherId(req);
  await attendanceService.assertTeacherCanAccessClass(id, String(req.body.classId));
  const content = await schoolService.createElearning({
    classId: String(req.body.classId),
    subject: String(req.body.subject),
    title: String(req.body.title),
    description: String(req.body.description),
    uploadedBy: id,
    file: req.file,
  });
  return created(res, content, "E-learning content uploaded");
});

export const listElearning = asyncHandler(async (req: Request, res: Response) => {
  await attendanceService.assertTeacherCanAccessClass(teacherId(req), req.params.classId!);
  return success(res, await schoolService.listElearning(req.params.classId!));
});

export const deleteElearning = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.deleteElearning(req.params.id!);
  return success(res, null, "E-learning content deleted");
});
