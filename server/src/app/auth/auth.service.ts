import { utils } from "../utils/utils";
import AppError from "../global/error";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../config/prisma";

const loginUser = async (data: any) => {
  const { password, username: userNameEmail } = data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: userNameEmail },
        { email:    userNameEmail },
        { schoolId: userNameEmail },
      ],
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User does not exist");
  }

  if (password && !(await utils.comparePasswords(password, user.password))) {
    throw new AppError(StatusCodes.FORBIDDEN, "Password is incorrect");
  }

  const { id, name, email, role, userImg, username, schoolId } = user;

  // FIX: schoolId is now included in the token payload so req.user.schoolId
  // is available in all protected routes (e.g. getMyFoundItem).
  const accessToken = utils.createToken({
    id,
    name,
    email,
    username,
    role,
    userImg,
    schoolId,
  });

  const refreshToken = utils.createRefreshToken({
    id,
    name,
    email,
    username,
    role,
    userImg,
    schoolId,
  });

  return {
    id:       user.id,
    name:     name || "User",
    username: user.username,
    email:    user.email,
    role,
    schoolId, // ← ADDED so frontend also gets it on login
    token:    accessToken,
    refreshToken,
  };
};

const portalLoginUser = async (data: any) => {
  const { portalUser, portalToken } = data;

  // Ideally, validate portalToken against SAS portal here.
  // Assuming token validation passes, look up user by portalUser.
  
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: portalUser },
        { email:    portalUser },
        { schoolId: portalUser },
      ],
    },
  });

  // Auto-provision if user doesn't exist
  if (!user) {
    // Try to fetch student details from masterlist to get correct info
    try {
      const { studentService } = await import("../modules/student/student.service");
      const masterlistData = await studentService.getStudentById(portalUser).catch(() => null);
      
      const email = masterlistData?.email || `${portalUser}@nbsc.edu.ph`;
      const name = masterlistData?.name || portalUser;
      
      // Check if email already exists
      const existingEmail = await prisma.user.findFirst({ where: { email } });
      if (existingEmail) {
         // Upgrade to ADMIN if they came in via portal and are not already ADMIN
         if (existingEmail.role !== "ADMIN") {
           user = await prisma.user.update({
             where: { id: existingEmail.id },
             data: { role: "ADMIN" },
           });
         } else {
           user = existingEmail;
         }
      } else {
         const hashedPassword = await utils.passwordHash("DefaultPortalPass123!"); // Or a random secure password
         // SAS Portal is exclusively for staff — always provision as ADMIN
         user = await prisma.user.create({
           data: {
             username: portalUser,
             email,
             name,
             schoolId: portalUser,
             password: hashedPassword,
             role: "ADMIN",
             course: masterlistData?.course || null,
             yearLevel: masterlistData?.yearLevel || null,
           }
         });
      }
    } catch (e) {
       console.error("Auto-provisioning failed for portal login", e);
       throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to auto-provision user from portal");
    }
  } else {
    // Existing user found — upgrade to ADMIN if not already (SAS Portal is admin-only)
    if (user.role !== "ADMIN") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    }
  }

  const { id, name, email, role, userImg, username, schoolId } = user;

  const accessToken = utils.createToken({
    id,
    name,
    email,
    username,
    role,
    userImg,
    schoolId,
  });

  const refreshToken = utils.createRefreshToken({
    id,
    name,
    email,
    username,
    role,
    userImg,
    schoolId,
  });

  return {
    id:       user.id,
    name:     name || "User",
    username: user.username,
    email:    user.email,
    role,
    schoolId,
    token:    accessToken,
    refreshToken,
  };
};

const newPasswords = async (data: any, user: JwtPayload) => {
  if (data.currentPassword === data.newPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is same");
  }
  const existedUser = await prisma.user.findFirst({
    where: { username: user.username },
  });
  if (
    data.currentPassword &&
    existedUser &&
    !(await utils.comparePasswords(data.currentPassword, existedUser.password))
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is incorrect");
  }

  const newHashPassword = await utils.passwordHash(data.newPassword);
  const updated = await prisma.user.update({
    where: { email: existedUser?.email },
    data:  { password: newHashPassword },
  });

  const { checkSecurityFirstAchievement } = await import("../utils/achievementService");
  await checkSecurityFirstAchievement(updated.id);
};

const changeEmail = async (email: any, user: JwtPayload) => {
  const existedUser: any = await prisma.user.findFirst({ where: email });
  if (existedUser) {
    throw new AppError(StatusCodes.CONFLICT, "Email already exists. Try new one!");
  }
  const updated = await prisma.user.update({
    where: { username: user?.username },
    data:  email,
  });

  const { checkProfileAchievements } = await import("../utils/achievementService");
  await checkProfileAchievements(updated.id);
};

const changeUsername = async (username: object, user: JwtPayload) => {
  const existedUser = await prisma.user.findFirst({ where: username });
  if (existedUser) {
    throw new AppError(StatusCodes.CONFLICT, "Username already exists. Try new one!");
  }
  const updated = await prisma.user.update({
    where: { email: user.email },
    data:  username,
  });

  const { checkProfileAchievements, checkProfileWarriorAchievement } = await import("../utils/achievementService");
  await checkProfileWarriorAchievement(updated.id);
  await checkProfileAchievements(updated.id);
};

export const authServices = {
  loginUser,
  portalLoginUser,
  newPasswords,
  changeEmail,
  changeUsername,
};