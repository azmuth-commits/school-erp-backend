import { prisma } from "../config/database.js";
import { AppError } from "../utils/apiResponse.js";

export async function assignHomework(input: {
  classId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  assignedBy: string;
}) {
  const classRow = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!classRow) {
    throw new AppError("Class not found", 404);
  }

  const homework = await prisma.homework.create({
    data: {
      classId: input.classId,
      subject: input.subject,
      title: input.title,
      description: input.description,
      dueDate: new Date(input.dueDate),
      assignedBy: input.assignedBy,
    },
  });

  const students = await prisma.student.findMany({ where: { classId: input.classId } });
  if (students.length) {
    await prisma.homeworkSubmission.createMany({
      data: students.map((student) => ({
        homeworkId: homework.id,
        studentId: student.id,
      })),
    });
  }

  return prisma.homework.findUnique({
    where: { id: homework.id },
    include: { submissions: true, class: true },
  });
}

export async function getHomeworkForClass(classId: string) {
  return prisma.homework.findMany({
    where: { classId },
    include: { submissions: true },
    orderBy: { dueDate: "desc" },
  });
}

export async function getHomeworkAssignedBy(teacherId: string) {
  return prisma.homework.findMany({
    where: { assignedBy: teacherId },
    include: { class: true, submissions: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateHomework(
  id: string,
  data: { title?: string; description?: string; dueDate?: string; subject?: string },
) {
  const existing = await prisma.homework.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Homework not found", 404);
  }
  return prisma.homework.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      subject: data.subject,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
}

export async function deleteHomework(id: string) {
  const existing = await prisma.homework.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Homework not found", 404);
  }
  await prisma.homework.delete({ where: { id } });
}

export async function getChildHomework(studentId: string) {
  return prisma.homeworkSubmission.findMany({
    where: { studentId },
    include: { homework: true },
    orderBy: { homework: { dueDate: "desc" } },
  });
}

export async function submitHomework(studentId: string, homeworkId: string) {
  const submission = await prisma.homeworkSubmission.findUnique({
    where: { homeworkId_studentId: { homeworkId, studentId } },
  });
  if (!submission) {
    throw new AppError("Homework not assigned to this student", 404);
  }
  return prisma.homeworkSubmission.update({
    where: { id: submission.id },
    data: { status: "submitted", submittedAt: new Date() },
  });
}
