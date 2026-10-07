import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import * as schoolService from "../services/school.service.js";
import * as attendanceService from "../services/attendance.service.js";
import * as homeworkService from "../services/homework.service.js";
import * as reportcardService from "../services/reportcard.service.js";
import { AppError, success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function parentId(req: Request): string {
  if (!req.user?.parentId) {
    throw new AppError("Parent profile not found", 403);
  }
  return req.user.parentId;
}

export const listChildren = asyncHandler(async (req: Request, res: Response) => {
  const children = await schoolService.getParentChildren(parentId(req));
  return success(
    res,
    children.map((child) => ({
      id: child.id,
      name: child.name,
      class: child.class.grade,
      section: child.class.section,
      rollNumber: child.rollNumber,
      avatar: child.avatar,
      initials: child.initials,
    })),
  );
});

export const getChild = asyncHandler(async (req: Request, res: Response) => {
  const child = await schoolService.assertParentChild(parentId(req), req.params.id!);
  return success(res, {
    id: child.id,
    name: child.name,
    class: child.class.grade,
    section: child.class.section,
    rollNumber: child.rollNumber,
    avatar: child.avatar,
    initials: child.initials,
  });
});

export const getChildAttendance = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  const records = await attendanceService.getStudentAttendance(req.params.childId!);
  return success(
    res,
    records.map((record) => ({
      date: record.date.toISOString().slice(0, 10),
      status: record.status.toLowerCase(),
      subject: record.subject,
      notes: record.notes,
    })),
  );
});

export const getChildAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  return success(res, await attendanceService.getAttendanceStats(req.params.childId!));
});

export const getChildHomework = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  const rows = await homeworkService.getChildHomework(req.params.childId!);
  return success(
    res,
    rows.map((row) => ({
      id: row.homework.id,
      subject: row.homework.subject,
      title: row.homework.title,
      description: row.homework.description,
      dueDate: row.homework.dueDate.toISOString().slice(0, 10),
      status: row.status,
      submittedAt: row.submittedAt,
    })),
  );
});

export const submitHomework = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  const submission = await homeworkService.submitHomework(req.params.childId!, req.params.homeworkId!);
  return success(res, submission, "Homework submitted");
});

export const getChildReportCards = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  return success(res, await reportcardService.getStudentReportCards(req.params.childId!));
});

export const downloadReportCard = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  return success(res, await reportcardService.downloadReportCard(req.params.id!));
});

export const getChildFees = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  const fees = await schoolService.getStudentFees(req.params.childId!);
  return success(
    res,
    fees.map((fee) => ({
      ...fee,
      amount: Number(fee.amount),
      type: fee.type.toLowerCase(),
      status: fee.status.toLowerCase(),
      dueDate: fee.dueDate.toISOString().slice(0, 10),
    })),
  );
});

export const payChildFee = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  const result = await schoolService.payFee(req.params.childId!, req.params.feeId!, req.body.amount);
  return success(res, result, "Payment recorded (gateway integration pending)");
});

export const getChildMarks = asyncHandler(async (req: Request, res: Response) => {
  await schoolService.assertParentChild(parentId(req), req.params.childId!);
  const marks = await schoolService.getChildMarks(req.params.childId!);
  return success(
    res,
    marks.map((mark) => ({
      ...mark,
      date: mark.date.toISOString().slice(0, 10),
    })),
  );
});

export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const children = await schoolService.getParentChildren(parentId(req));
  const classIds = children.map((child) => child.classId);
  const announcements = await schoolService.listAnnouncements({ classIds });
  const reads = await prisma.announcementRead.findMany({
    where: { parentId: parentId(req) },
  });
  const readSet = new Set(reads.map((row) => row.announcementId));
  return success(
    res,
    announcements.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      date: item.date.toISOString().slice(0, 10),
      type: item.type === "GENERAL" ? "circular" : item.type === "EVENT" ? "event" : "closure",
      isRead: readSet.has(item.id),
    })),
  );
});

export const markAnnouncementRead = asyncHandler(async (req: Request, res: Response) => {
  const row = await schoolService.markAnnouncementRead(parentId(req), req.params.id!);
  return success(res, row, "Announcement marked as read");
});
