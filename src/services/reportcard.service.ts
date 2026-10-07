import { prisma } from "../config/database.js";
import { AppError } from "../utils/apiResponse.js";
import { assertReportCardFile } from "../utils/file.util.js";
import { deleteFile, getDownloadUrl, uploadFile } from "./s3.service.js";

export async function createReportCard(input: {
  studentId: string;
  exam: string;
  date: string;
  overallPercentage: number;
  grade: string;
  generatedBy: string;
  file?: Express.Multer.File;
}) {
  assertReportCardFile(input.file);
  const student = await prisma.student.findUnique({ where: { id: input.studentId } });
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const uploaded = await uploadFile({
    folder: "report-cards",
    buffer: input.file!.buffer,
    mimetype: input.file!.mimetype,
    originalName: input.file!.originalname,
  });

  return prisma.reportCard.create({
    data: {
      studentId: input.studentId,
      exam: input.exam,
      date: new Date(input.date),
      overallPercentage: input.overallPercentage,
      grade: input.grade,
      pdfUrl: uploaded.url,
      pdfKey: uploaded.key,
      generatedBy: input.generatedBy,
    },
  });
}

export async function getStudentReportCards(studentId: string) {
  return prisma.reportCard.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
  });
}

export async function getClassReportCards(classId: string, exam: string) {
  return prisma.reportCard.findMany({
    where: { exam, student: { classId } },
    include: { student: true },
    orderBy: { student: { rollNumber: "asc" } },
  });
}

export async function updateReportCard(
  id: string,
  data: { exam?: string; overallPercentage?: number; grade?: string; date?: string },
) {
  const existing = await prisma.reportCard.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Report card not found", 404);
  }
  return prisma.reportCard.update({
    where: { id },
    data: {
      exam: data.exam,
      overallPercentage: data.overallPercentage,
      grade: data.grade,
      date: data.date ? new Date(data.date) : undefined,
    },
  });
}

export async function downloadReportCard(id: string) {
  const existing = await prisma.reportCard.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Report card not found", 404);
  }
  const url = await getDownloadUrl(existing.pdfKey);
  return { ...existing, downloadUrl: url };
}

export async function deleteReportCardFiles(key: string) {
  await deleteFile(key);
}
