import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AttendanceStatus,
  FeeStatus,
  FeeType,
  NotificationType,
  PrismaClient,
  UserRole,
} from "../generated/prisma/client.js";
import { hashPassword } from "../src/utils/password.util.js";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.announcementRead.deleteMany();
  await prisma.eLearningContent.deleteMany();
  await prisma.homeworkSubmission.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.classAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, teacherHash, parentHash] = await Promise.all([
    hashPassword("Admin@123"),
    hashPassword("Teacher@123"),
    hashPassword("Parent@123"),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "School Admin",
      email: "admin@school.com",
      mobile: "+919876543200",
      loginId: "ADMIN001",
      password: adminHash,
      role: UserRole.ADMIN,
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya.sharma@school.com",
      mobile: "+919876543211",
      loginId: "TEACHER001",
      password: teacherHash,
      role: UserRole.TEACHER,
      teacher: { create: { subject: "Mathematics" } },
    },
    include: { teacher: true },
  });

  const parentUser = await prisma.user.create({
    data: {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      mobile: "+919876543210",
      loginId: "PARENT001",
      password: parentHash,
      role: UserRole.PARENT,
      parent: { create: {} },
    },
    include: { parent: true },
  });

  const teacherId = teacherUser.teacher!.id;
  const parentId = parentUser.parent!.id;

  const [class5A, class5B, class8A, class1C, class8B] = await Promise.all([
    prisma.class.create({ data: { grade: "5", section: "A", classTeacherId: teacherId } }),
    prisma.class.create({ data: { grade: "5", section: "B" } }),
    prisma.class.create({ data: { grade: "8", section: "A" } }),
    prisma.class.create({ data: { grade: "1", section: "C" } }),
    prisma.class.create({ data: { grade: "8", section: "B" } }),
  ]);

  await prisma.classAssignment.createMany({
    data: [
      { teacherId, classId: class5A.id },
      { teacherId, classId: class5B.id },
      { teacherId, classId: class8A.id },
    ],
  });

  const [rohan, priya, amit] = await Promise.all([
    prisma.student.create({
      data: { parentId, classId: class5A.id, name: "Rohan Kumar", rollNumber: "15", initials: "RK" },
    }),
    prisma.student.create({
      data: { parentId, classId: class1C.id, name: "Priya Kumar", rollNumber: "8", initials: "PK" },
    }),
    prisma.student.create({
      data: { parentId, classId: class8B.id, name: "Amit Kumar", rollNumber: "22", initials: "AK" },
    }),
  ]);

  const attendance: { date: string; status: AttendanceStatus; notes?: string }[] = [
    { date: "2026-10-01", status: AttendanceStatus.PRESENT },
    { date: "2026-10-02", status: AttendanceStatus.PRESENT },
    { date: "2026-10-03", status: AttendanceStatus.PRESENT },
    { date: "2026-10-04", status: AttendanceStatus.ABSENT, notes: "Medical leave" },
    { date: "2026-10-05", status: AttendanceStatus.PRESENT },
    { date: "2026-10-06", status: AttendanceStatus.HOLIDAY },
    { date: "2026-10-07", status: AttendanceStatus.HOLIDAY },
    { date: "2026-10-08", status: AttendanceStatus.PRESENT },
    { date: "2026-10-09", status: AttendanceStatus.PRESENT },
    { date: "2026-10-10", status: AttendanceStatus.LATE, notes: "Traffic delay" },
  ];

  await prisma.attendance.createMany({
    data: attendance.map((row) => ({
      studentId: rohan.id,
      classId: class5A.id,
      date: new Date(row.date),
      status: row.status,
      notes: row.notes,
      markedBy: teacherId,
    })),
  });

  const homework = await prisma.homework.create({
    data: {
      classId: class5A.id,
      subject: "Mathematics",
      title: "Chapter 5: Fractions",
      description: "Complete exercises 5.1 to 5.5 from the textbook",
      dueDate: new Date("2026-10-08"),
      assignedBy: teacherId,
    },
  });
  await prisma.homeworkSubmission.create({
    data: { homeworkId: homework.id, studentId: rohan.id },
  });

  await prisma.mark.createMany({
    data: [
      { studentId: rohan.id, exam: "Mid-Term", subject: "Mathematics", marks: 85, totalMarks: 100, percentage: 85, date: new Date("2026-09-15") },
      { studentId: rohan.id, exam: "Mid-Term", subject: "Science", marks: 78, totalMarks: 100, percentage: 78, date: new Date("2026-09-15") },
      { studentId: rohan.id, exam: "Mid-Term", subject: "English", marks: 92, totalMarks: 100, percentage: 92, date: new Date("2026-09-15") },
    ],
  });

  const examFee = await prisma.fee.create({
    data: {
      studentId: rohan.id,
      type: FeeType.EXAM,
      amount: 2000,
      dueDate: new Date("2026-09-01"),
      status: FeeStatus.PAID,
      description: "Mid-Term Examination Fees",
    },
  });
  await prisma.feePayment.create({
    data: { feeId: examFee.id, amount: 2000, paidDate: new Date("2026-08-25") },
  });
  await prisma.fee.createMany({
    data: [
      {
        studentId: rohan.id,
        type: FeeType.QUARTERLY,
        amount: 15000,
        dueDate: new Date("2026-10-15"),
        description: "Q3 Tuition Fees (October-December 2026)",
      },
      {
        studentId: rohan.id,
        type: FeeType.TRANSPORT,
        amount: 5000,
        dueDate: new Date("2026-10-15"),
        description: "Transportation Fees - October 2026",
      },
    ],
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: "Diwali Holidays Announcement",
        description: "School will remain closed from October 25th to November 5th for Diwali holidays.",
        date: new Date("2026-10-15"),
        type: NotificationType.URGENT,
        createdBy: admin.id,
      },
      {
        title: "Annual Sports Day",
        description: "Annual Sports Day will be held on November 20th. Parents are cordially invited.",
        date: new Date("2026-10-12"),
        type: NotificationType.EVENT,
        createdBy: admin.id,
      },
      {
        title: "Fee Payment Reminder",
        description: "Please clear the pending quarterly fees by October 20th.",
        date: new Date("2026-10-10"),
        type: NotificationType.GENERAL,
        createdBy: admin.id,
      },
    ],
  });

  await prisma.calendarEvent.createMany({
    data: [
      { title: "Diwali Holidays", date: new Date("2026-10-25"), type: "holiday" },
      { title: "Annual Sports Day", date: new Date("2026-11-20"), type: "event" },
      { title: "Final Exams", date: new Date("2026-12-01"), type: "exam" },
      { title: "Christmas Celebration", date: new Date("2026-12-23"), type: "activity" },
    ],
  });

  const monday = [
    { period: 1, time: "8:00 AM", subject: "Mathematics" },
    { period: 2, time: "9:00 AM", subject: "English" },
    { period: 3, time: "10:00 AM", subject: "Science" },
    { period: 4, time: "11:00 AM", subject: "Hindi" },
    { period: 5, time: "12:00 PM", subject: "Social Studies" },
  ];
  await prisma.timetable.createMany({
    data: monday.map((row) => ({ classId: class5A.id, day: "Monday", teacherId, ...row })),
  });

  console.log("Seed complete");
  console.log("Admin    ADMIN001 / Admin@123");
  console.log("Teacher  TEACHER001 / Teacher@123");
  console.log("Parent   PARENT001 / Parent@123");
  console.log(`Rohan=${rohan.id} Priya=${priya.id} Amit=${amit.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
