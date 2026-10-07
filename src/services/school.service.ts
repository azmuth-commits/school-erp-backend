import { FeeStatus, FeeType, NotificationType, UserRole } from "../../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/apiResponse.js";
import { hashPassword } from "../utils/password.util.js";
import { assertElearningVideo } from "../utils/file.util.js";
import { deleteFile, uploadFile } from "./s3.service.js";

export async function createClass(grade: string, section: string) {
  return prisma.class.create({ data: { grade, section } });
}

export async function listClasses() {
  return prisma.class.findMany({
    include: {
      classTeacher: { include: { user: true } },
      _count: { select: { students: true } },
    },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });
}

export async function assignClassTeacher(classId: string, teacherId: string) {
  const [classRow, teacher] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.teacher.findUnique({ where: { id: teacherId } }),
  ]);
  if (!classRow) throw new AppError("Class not found", 404);
  if (!teacher) throw new AppError("Teacher not found", 404);

  return prisma.class.update({
    where: { id: classId },
    data: { classTeacherId: teacherId },
    include: { classTeacher: { include: { user: true } } },
  });
}

export async function deleteClass(id: string) {
  const classRow = await prisma.class.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!classRow) throw new AppError("Class not found", 404);
  if (classRow._count.students > 0) {
    throw new AppError("Cannot delete a class that still has students", 409);
  }
  await prisma.class.delete({ where: { id } });
}

export async function createTeacher(input: {
  name: string;
  mobile: string;
  email?: string;
  loginId: string;
  password: string;
  subject?: string;
}) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ loginId: input.loginId }, { mobile: input.mobile }, ...(input.email ? [{ email: input.email }] : [])],
    },
  });
  if (existing) throw new AppError("User already exists", 409);

  return prisma.user.create({
    data: {
      name: input.name,
      mobile: input.mobile,
      email: input.email,
      loginId: input.loginId,
      password: await hashPassword(input.password),
      role: UserRole.TEACHER,
      teacher: { create: { subject: input.subject } },
    },
    include: { teacher: { include: { classes: { include: { class: true } } } } },
  });
}

export async function listTeachers() {
  return prisma.teacher.findMany({
    include: {
      user: true,
      classes: { include: { class: true } },
      homeroomClasses: true,
    },
  });
}

export async function updateTeacher(id: string, data: { name?: string; mobile?: string; email?: string; subject?: string }) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  return prisma.teacher.update({
    where: { id },
    data: {
      subject: data.subject,
      user: {
        update: {
          name: data.name,
          mobile: data.mobile,
          email: data.email,
        },
      },
    },
    include: { user: true, classes: { include: { class: true } } },
  });
}

export async function assignTeacherToClass(teacherId: string, classId: string) {
  const [teacher, classRow] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: teacherId } }),
    prisma.class.findUnique({ where: { id: classId } }),
  ]);
  if (!teacher) throw new AppError("Teacher not found", 404);
  if (!classRow) throw new AppError("Class not found", 404);

  return prisma.classAssignment.upsert({
    where: { teacherId_classId: { teacherId, classId } },
    update: {},
    create: { teacherId, classId },
    include: { class: true, teacher: { include: { user: true } } },
  });
}

export async function removeTeacherFromClass(teacherId: string, classId: string) {
  await prisma.classAssignment.delete({
    where: { teacherId_classId: { teacherId, classId } },
  }).catch(() => {
    throw new AppError("Assignment not found", 404);
  });
}

export async function createTimetableEntry(input: {
  classId: string;
  day: string;
  period: number;
  time: string;
  subject: string;
  teacherId?: string;
}) {
  return prisma.timetable.create({ data: input });
}

export async function getClassTimetable(classId: string) {
  const entries = await prisma.timetable.findMany({
    where: { classId },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });
  const grouped = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = grouped.get(entry.day) ?? [];
    list.push(entry);
    grouped.set(entry.day, list);
  }
  return [...grouped.entries()].map(([day, periods]) => ({ day, periods }));
}

export async function updateTimetable(id: string, data: Partial<{ day: string; period: number; time: string; subject: string; teacherId: string | null }>) {
  const existing = await prisma.timetable.findUnique({ where: { id } });
  if (!existing) throw new AppError("Timetable entry not found", 404);
  return prisma.timetable.update({ where: { id }, data });
}

export async function deleteTimetable(id: string) {
  await prisma.timetable.delete({ where: { id } }).catch(() => {
    throw new AppError("Timetable entry not found", 404);
  });
}

export async function createFee(input: {
  studentId: string;
  type: FeeType;
  amount: number;
  dueDate: string;
  description: string;
}) {
  const student = await prisma.student.findUnique({ where: { id: input.studentId } });
  if (!student) throw new AppError("Student not found", 404);
  return prisma.fee.create({
    data: {
      studentId: input.studentId,
      type: input.type,
      amount: input.amount,
      dueDate: new Date(input.dueDate),
      description: input.description,
    },
  });
}

export async function getStudentFees(studentId: string) {
  return prisma.fee.findMany({
    where: { studentId },
    include: { payments: true },
    orderBy: { dueDate: "desc" },
  });
}

export async function updateFee(id: string, data: Partial<{ type: FeeType; amount: number; dueDate: string; status: FeeStatus; description: string }>) {
  const existing = await prisma.fee.findUnique({ where: { id } });
  if (!existing) throw new AppError("Fee not found", 404);
  return prisma.fee.update({
    where: { id },
    data: {
      type: data.type,
      amount: data.amount,
      status: data.status,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
}

export async function deleteFee(id: string) {
  await prisma.fee.delete({ where: { id } }).catch(() => {
    throw new AppError("Fee not found", 404);
  });
}

export async function payFee(studentId: string, feeId: string, amount: number) {
  const fee = await prisma.fee.findFirst({ where: { id: feeId, studentId } });
  if (!fee) throw new AppError("Fee not found", 404);
  if (fee.status === FeeStatus.PAID) throw new AppError("Fee is already paid", 409);

  const payment = await prisma.feePayment.create({
    data: {
      feeId,
      amount,
      paidDate: new Date(),
    },
  });

  const updated = await prisma.fee.update({
    where: { id: feeId },
    data: { status: FeeStatus.PAID },
    include: { payments: true },
  });

  return { fee: updated, payment };
}

export async function createAnnouncement(input: {
  title: string;
  description: string;
  date: string;
  type: NotificationType;
  targetClass?: string;
  createdBy: string;
}) {
  return prisma.announcement.create({
    data: {
      title: input.title,
      description: input.description,
      date: new Date(input.date),
      type: input.type,
      targetClass: input.targetClass,
      createdBy: input.createdBy,
    },
  });
}

export async function listAnnouncements(filters?: { createdBy?: string; classIds?: string[] }) {
  return prisma.announcement.findMany({
    where: {
      createdBy: filters?.createdBy,
      OR: filters?.classIds
        ? [{ targetClass: null }, { targetClass: { in: filters.classIds } }]
        : undefined,
    },
    orderBy: { date: "desc" },
  });
}

export async function updateAnnouncement(
  id: string,
  data: Partial<{ title: string; description: string; date: string; type: NotificationType; targetClass: string | null }>,
) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError("Announcement not found", 404);
  return prisma.announcement.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      targetClass: data.targetClass,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } }).catch(() => {
    throw new AppError("Announcement not found", 404);
  });
}

export async function markAnnouncementRead(parentId: string, announcementId: string) {
  return prisma.announcementRead.upsert({
    where: { announcementId_parentId: { announcementId, parentId } },
    update: { readAt: new Date() },
    create: { announcementId, parentId },
  });
}

export async function createElearning(input: {
  classId: string;
  subject: string;
  title: string;
  description: string;
  uploadedBy: string;
  file?: Express.Multer.File;
}) {
  assertElearningVideo(input.file);
  const classRow = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!classRow) throw new AppError("Class not found", 404);

  const uploaded = await uploadFile({
    folder: "e-learning",
    buffer: input.file!.buffer,
    mimetype: input.file!.mimetype,
    originalName: input.file!.originalname,
  });

  return prisma.eLearningContent.create({
    data: {
      classId: input.classId,
      subject: input.subject,
      title: input.title,
      description: input.description,
      uploadedBy: input.uploadedBy,
      videoUrl: uploaded.url,
      videoKey: uploaded.key,
    },
  });
}

export async function listElearning(classId: string) {
  return prisma.eLearningContent.findMany({
    where: { classId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteElearning(id: string) {
  const existing = await prisma.eLearningContent.findUnique({ where: { id } });
  if (!existing) throw new AppError("E-learning content not found", 404);
  await deleteFile(existing.videoKey);
  await prisma.eLearningContent.delete({ where: { id } });
}

export async function getParentChildren(parentId: string) {
  return prisma.student.findMany({
    where: { parentId },
    include: { class: true },
  });
}

export async function assertParentChild(parentId: string, childId: string) {
  const child = await prisma.student.findFirst({
    where: { id: childId, parentId },
    include: { class: true },
  });
  if (!child) throw new AppError("Child not found", 404);
  return child;
}

export async function getChildMarks(studentId: string) {
  return prisma.mark.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
  });
}
