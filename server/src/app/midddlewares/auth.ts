import { NextFunction, Request, Response } from "express";
import { utils } from "../utils/utils";
import AppError from "../global/error";
import { StatusCodes } from "http-status-codes";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      const verifiedUser = utils.verifyToken(token);
      req.user = verifiedUser;

      if (!verifiedUser) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
      }

      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
        return next(new AppError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
      }
      next(err);
    }
  };
};

export default auth;