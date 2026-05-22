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
    schoolId, // ← ADDED
  });

  return {
    id:       user.id,
    name:     name || "User",
    username: user.username,
    email:    user.email,
    role,
    schoolId, // ← ADDED so frontend also gets it on login
    token:    accessToken,
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
      
      const email = masterlistData?.email || `${portalUser}@student.nbsc.edu.ph`;
      const name = masterlistData?.name || portalUser;
      
      // Check if email already exists
      const existingEmail = await prisma.user.findFirst({ where: { email } });
      if (existingEmail) {
         user = existingEmail;
      } else {
         const hashedPassword = await utils.passwordHash("DefaultPortalPass123!"); // Or a random secure password
         user = await prisma.user.create({
           data: {
             username: portalUser,
             email,
             name,
             schoolId: portalUser,
             password: hashedPassword,
             role: "USER",
             course: masterlistData?.course || null,
             yearLevel: masterlistData?.yearLevel || null,
           }
         });
      }
    } catch (e) {
       console.error("Auto-provisioning failed for portal login", e);
       throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to auto-provision user from portal");
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

  return {
    id:       user.id,
    name:     name || "User",
    username: user.username,
    email:    user.email,
    role,
    schoolId,
    token:    accessToken,
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
  await prisma.user.update({
    where: { email: existedUser?.email },
    data:  { password: newHashPassword },
  });
};

const changeEmail = async (email: any, user: JwtPayload) => {
  const existedUser: any = await prisma.user.findFirst({ where: email });
  if (existedUser) {
    throw new AppError(StatusCodes.CONFLICT, "Email already exists. Try new one!");
  }
  await prisma.user.update({
    where: { username: user?.username },
    data:  email,
  });
};

const changeUsername = async (username: object, user: JwtPayload) => {
  const existedUser = await prisma.user.findFirst({ where: username });
  if (existedUser) {
    throw new AppError(StatusCodes.CONFLICT, "Username already exists. Try new one!");
  }
  await prisma.user.update({
    where: { email: user.email },
    data:  username,
  });
};

export const authServices = {
  loginUser,
  portalLoginUser,
  newPasswords,
  changeEmail,
  changeUsername,
};