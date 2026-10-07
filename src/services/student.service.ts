import { prisma } from "../config/database.js";
import { AppError } from "../utils/apiResponse.js";
import { hashPassword } from "../utils/password.util.js";
import { UserRole } from "../../generated/prisma/client.js";

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function createStudentWithParent(input: {
  name: string;
  rollNumber: string;
  classId: string;
  avatar?: string;
  parent: {
    name: string;
    mobile: string;
    email?: string;
    loginId: string;
    password: string;
  };
}) {
  const classRow = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!classRow) {
    throw new AppError("Class not found", 404);
  }

  const existingParent = await prisma.user.findFirst({
    where: {
      OR: [
        { loginId: input.parent.loginId },
        { mobile: input.parent.mobile },
        ...(input.parent.email ? [{ email: input.parent.email }] : []),
      ],
    },
    include: { parent: true },
  });

  return prisma.$transaction(async (tx) => {
    let parentId = existingParent?.parent?.id;
    if (!parentId) {
      if (existingParent) {
        throw new AppError("A user with this parent login already exists", 409);
      }
      const parentUser = await tx.user.create({
        data: {
          name: input.parent.name,
          mobile: input.parent.mobile,
          email: input.parent.email,
          loginId: input.parent.loginId,
          password: await hashPassword(input.parent.password),
          role: UserRole.PARENT,
          parent: { create: {} },
        },
        include: { parent: true },
      });
      parentId = parentUser.parent!.id;
    }

    return tx.student.create({
      data: {
        name: input.name,
        rollNumber: input.rollNumber,
        classId: input.classId,
        parentId,
        avatar: input.avatar,
        initials: initialsFromName(input.name),
      },
      include: {
        class: true,
        parent: { include: { user: true } },
      },
    });
  });
}

export async function listStudents(page: number, limit: number, search?: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { rollNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { class: true, parent: { include: { user: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getStudent(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true, parent: { include: { user: true } }, marks: true, fees: true },
  });
  if (!student) {
    throw new AppError("Student not found", 404);
  }
  return student;
}

export async function updateStudent(
  id: string,
  data: { name?: string; rollNumber?: string; classId?: string; avatar?: string },
) {
  await getStudent(id);
  return prisma.student.update({
    where: { id },
    data: {
      ...data,
      initials: data.name ? initialsFromName(data.name) : undefined,
    },
    include: { class: true, parent: { include: { user: true } } },
  });
}

export async function deleteStudent(id: string) {
  await getStudent(id);
  await prisma.student.delete({ where: { id } });
}
