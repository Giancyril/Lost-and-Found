import { Request, Response, NextFunction } from "express";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";
import { authServices } from "./auth.service";
import { logLoginAttempt, getClientIp } from "../utils/securityController"; 
import { TLogin } from "../global/interface";

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, username } = req.body;

    // loginUser expects { username: <email or username>, password }
    const user = await authServices.loginUser({
      username: email || username, // ← pass as "username" key
      password,
    });

    try {
      await logLoginAttempt({
        userId:    user.id,
        username:  user.username,
        email:     user.email,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
        success:   true,
      });
    } catch (logErr) {
      console.error("[LoginLog] Failed to log success:", logErr);
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Login successful",
      data:       user,
    });
  } catch (error: any) {
    try {
      await logLoginAttempt({
        email:     req.body?.email || req.body?.username || "",
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
        success:   false,
        reason:    error.message,
      });
    } catch (logErr) {
      console.error("[LoginLog] Failed to log failure:", logErr);
    }

    next(error);
  }
};
const newPasswords = async (req: Request, res: Response) => {
  try {
    const passwordData = req.body;
    const result = await authServices.newPasswords(passwordData, req.user);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Password changed successfully',
        data: result,
      });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const changeEmail = async (req: Request, res: Response) => {
  try {
    const email:string = req.body;
    // console.log(email)
    const result = await authServices.changeEmail(email, req.user);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Email changed successfully',
        data: result,
      });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};

const changeUsername = async (req: Request, res: Response) => {
  try {
    const username = req.body;
    const result = await authServices.changeUsername(username, req.user);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Username changed successfully',
        data: result,
      });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};


export const authController={
    login,
    newPasswords,
    changeEmail,
    changeUsername
}