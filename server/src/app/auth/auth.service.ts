import { utils } from "../utils/utils";
import AppError from "../global/error";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../config/prisma";

const loginUser = async (data: any) => {
  const { password, username: userNameEmail } = data;

  // ── Find user by username, email, OR schoolId ─────────────────────────────
  // This is the only change from the original — schoolId is now a third OR branch.
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: userNameEmail },
        { email:    userNameEmail },
        { schoolId: userNameEmail }, // ← NEW: students log in with schoolId
      ],
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User does not exist");
  }

  if (password && !(await utils.comparePasswords(password, user.password))) {
    throw new AppError(StatusCodes.FORBIDDEN, "Password is incorrect");
  }

  const { id, name, email, role, userImg, username } = user;
  const accessToken = utils.createToken({ id, name, email, username, role, userImg });

  return {
    id:       user.id,
    name:     name || "User",
    username: user.username,
    email:    user.email,
    role,
    token:    accessToken,
  };
};

// ── All other functions unchanged from your original ─────────────────────────

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
  newPasswords,
  changeEmail,
  changeUsername,
};