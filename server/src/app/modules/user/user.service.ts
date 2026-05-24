import { User } from "@prisma/client";
import { utils } from "../../utils/utils";
import AppError from "../../global/error";
import prisma from "../../config/prisma";

const registerUser = async (user: any) => {
  // Build the identifier fields from either schoolId or username/email
  const username = user.username || user.schoolId;
  const email    = user.email    || `${user.schoolId}@student.nbsc.edu.ph`;

  const existedUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
        ...(user.schoolId ? [{ schoolId: user.schoolId }] : []),
      ],
    },
  });

  if (existedUser) {
    throw new AppError(406, "Username, email, or School ID already exists");
  }

  const hashedPassword = await utils.passwordHash(user.password);

  const result = await prisma.$transaction(async (transactions) => {
    const createdUser = await transactions.user.create({
      data: {
        username,
        email,
        password:   hashedPassword,
        userImg:    user.userImg  || "",
        name:       user.name     || "",
        schoolId:   user.schoolId || null,  
        course:     user.course    || null,  
        yearLevel:  user.yearLevel || null,  
 
      },
    });
    // Auto-Sync Option A: Link any past anonymous records that used this email to the new user
    await transactions.claim.updateMany({
      where: { schoolEmail: email, userId: null },
      data: { 
        userId: createdUser.id,
        claimantName: createdUser.name || createdUser.username 
      },
    });
    await transactions.lostItem.updateMany({
      where: { schoolEmail: email, userId: null },
      data: { 
        userId: createdUser.id,
        reporterName: createdUser.name || createdUser.username 
      },
    });
    await transactions.foundItem.updateMany({
      where: { schoolEmail: email, userId: null },
      data: { 
        userId: createdUser.id,
        reporterName: createdUser.name || createdUser.username 
      },
    });
    await transactions.supportTicket.updateMany({
      where: { senderEmail: email },
      data: { senderName: createdUser.name || createdUser.username },
    });
    await transactions.feedback.updateMany({
      where: { senderEmail: email },
      data: { senderName: createdUser.name || createdUser.username },
    });

    return {
      id:        createdUser.id,
      userImg:   createdUser.userImg,
      username:  createdUser.username,
      email:     createdUser.email,
      schoolId:  createdUser.schoolId,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };
  });

  return result;
};

const allUsers = async () => {
  const result = await prisma.user.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      activated: "desc",
    },
  });
  return result;
};

const blockUser = async (id: string) => {
  const users = await prisma.user.findFirst({
    where: {
      AND: [{ id }, { activated: true }],
    },
  });

  if (users) {
    await prisma.user.update({
      where: {
        id,
      },
      data: {
        activated: false,
      },
    });
    return "block";
  } else {
    await prisma.user.update({
      where: {
        id,
      },
      data: {
        activated: true,
      },
    });
    return "active";
  }
};

const softDeleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(400, "User is already deleted");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      activated: false,
    },
  });

  return {
    id: updatedUser.id,
    username: user.username,
    email: user.email,
    deleted: true,
    deletedAt: updatedUser.deletedAt,
  };
};

const backfillCourseAndYearLevel = async () => {
  const users = await prisma.user.findMany({
    where: { schoolId: { not: null }, course: null },
    select: { id: true, schoolId: true },
  });

  const results = { updated: 0, skipped: 0, errors: [] as string[] };

  for (const user of users) {
    try {
      const { studentService } = await import("../student/student.service");
      const student = await studentService.getStudentById(user.schoolId!);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          course:    student.course,
          yearLevel: student.yearLevel,
        },
      });
      results.updated++;
    } catch (e: any) {
      results.skipped++;
      results.errors.push(`${user.schoolId}: ${e.message}`);
    }
  }

  return results;
};

const updateUser = async (id: string, data: Partial<User>) => {
  const result = await prisma.user.update({
    where: {
      id,
    },
    data,
  });
  return result;
};

export const userService = {
  registerUser,
  allUsers,
  blockUser,
  softDeleteUser,
  backfillCourseAndYearLevel,
  updateUser,
};