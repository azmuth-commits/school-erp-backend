import { AttendanceStatus } from "../../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/apiResponse.js";

export async function assertTeacherCanAccessClass(teacherId: string, classId: string) {
  const assigned = await prisma.classAssignment.findUnique({
    where: { teacherId_classId: { teacherId, classId } },
  });
  const homeroom = await prisma.class.findFirst({
    where: { id: classId, classTeacherId: teacherId },
  });
  if (!assigned && !homeroom) {
    throw new AppError("You are not assigned to this class", 403);
  }
}

export async function markAttendance(input: {
  classId: string;
  date: string;
  markedBy: string;
  records: { studentId: string; status: AttendanceStatus; notes?: string; subject?: string }[];
}) {
  const date = new Date(input.date);
  const students = await prisma.student.findMany({
    where: { classId: input.classId, id: { in: input.records.map((r) => r.studentId) } },
  });
  if (students.length !== input.records.length) {
    throw new AppError("One or more students do not belong to this class", 400);
  }

  const ops = input.records.map((record) =>
    prisma.attendance.upsert({
      where: { studentId_date: { studentId: record.studentId, date } },
      update: {
        status: record.status,
        notes: record.notes,
        subject: record.subject,
        markedBy: input.markedBy,
        classId: input.classId,
      },
      create: {
        studentId: record.studentId,
        classId: input.classId,
        date,
        status: record.status,
        notes: record.notes,
        subject: record.subject,
        markedBy: input.markedBy,
      },
    }),
  );

  return prisma.$transaction(ops);
}

export async function getClassAttendance(classId: string, date: string) {
  return prisma.attendance.findMany({
    where: { classId, date: new Date(date) },
    include: { student: true },
    orderBy: { student: { rollNumber: "asc" } },
  });
}

export async function getStudentAttendance(studentId: string) {
  return prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
  });
}

export async function updateAttendance(
  id: string,
  data: { status?: AttendanceStatus; notes?: string; subject?: string },
) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Attendance record not found", 404);
  }
  return prisma.attendance.update({ where: { id }, data });
}

export async function getAttendanceStats(studentId: string) {
  const records = await prisma.attendance.findMany({ where: { studentId } });
  const presentDays = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const absentDays = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
  const holidayDays = records.filter((r) => r.status === AttendanceStatus.HOLIDAY).length;
  const lateDays = records.filter((r) => r.status === AttendanceStatus.LATE).length;
  const counted = presentDays + absentDays + lateDays;
  const percentage = counted === 0 ? 0 : Math.round(((presentDays + lateDays) / counted) * 100);

  const byMonth = new Map<string, { present: number; absent: number; counted: number }>();
  for (const record of records) {
    const month = record.date.toLocaleString("en-IN", { month: "long", year: "numeric" });
    const current = byMonth.get(month) ?? { present: 0, absent: 0, counted: 0 };
    if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE) {
      current.present += 1;
    }
    if (record.status === AttendanceStatus.ABSENT) {
      current.absent += 1;
    }
    if (record.status !== AttendanceStatus.HOLIDAY) {
      current.counted += 1;
    }
    byMonth.set(month, current);
  }

  return {
    totalDays: records.length,
    presentDays,
    absentDays,
    holidayDays,
    lateDays,
    percentage,
    monthlyStats: [...byMonth.entries()].map(([month, stats]) => ({
      month,
      present: stats.present,
      absent: stats.absent,
      percentage: stats.counted === 0 ? 0 : Math.round((stats.present / stats.counted) * 100),
    })),
  };
}
