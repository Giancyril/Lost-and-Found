import { Request, Response, NextFunction } from "express";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";
import { authServices } from "./auth.service";
import { logLoginAttempt, getClientIp } from "../utils/securityController"; 
import { TLogin } from "../global/interface";
import { utils } from "../utils/utils";
import { pointsService } from "../modules/points/points.service";
import { checkStreakAndAwardBonus } from "../utils/achievementService";

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

    // Record login streak and award milestones
    await pointsService.recordLoginStreak(user.id);
    await checkStreakAndAwardBonus(user.id);

    const { refreshToken, ...userData } = user;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Login successful",
      data:       userData,
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

const portalLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { portalUser, portalToken } = req.body;
    
    if (!portalUser || !portalToken) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Missing portal credentials",
        data: null,
      });
    }

    const user = await authServices.portalLoginUser({
      portalUser,
      portalToken,
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
      console.error("[LoginLog] Failed to log success for portal login:", logErr);
    }

    // Record login streak and award milestones for portal login too
    await pointsService.recordLoginStreak(user.id);
    await checkStreakAndAwardBonus(user.id);

    const { refreshToken, ...userData } = user;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Portal login successful",
      data:       userData,
    });
  } catch (error: any) {
    try {
      await logLoginAttempt({
        email:     req.body?.portalUser || "",
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
        success:   false,
        reason:    error.message,
      });
    } catch (logErr) {
      console.error("[LoginLog] Failed to log failure for portal login:", logErr);
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


const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "No refresh token" });
    }

    try {
      const decoded: any = utils.verifyToken(refreshToken);
      const accessToken = utils.createToken({
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
        userImg: decoded.userImg,
        schoolId: decoded.schoolId,
      });

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Token refreshed",
        data: { token: accessToken },
      });
    } catch (e) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Invalid refresh token" });
    }
  } catch (error) {
    next(error);
  }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const authController={
    login,
    portalLogin,
    newPasswords,
    changeEmail,
    changeUsername,
    refresh,
    logout
}