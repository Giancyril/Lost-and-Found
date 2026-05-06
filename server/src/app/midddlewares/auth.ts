import { NextFunction, Request, Response } from "express";
import { utils } from "../utils/utils";
import AppError from "../global/error";
import { StatusCodes } from "http-status-codes";

const auth = (isOptional: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      console.log(`[AUTH DEBUG] Method: ${req.method} URL: ${req.originalUrl} Optional: ${isOptional}`);
      console.log(`[AUTH DEBUG] Auth Header:`, authHeader ? authHeader.substring(0, 50) + '...' : 'MISSING');

      if (!authHeader) {
        if (isOptional) {
          return next();
        }
        console.warn(`[AUTH DEBUG] No auth header found for protected route`);
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
      if (isOptional) {
        console.log(`[AUTH DEBUG] Optional auth failed, proceeding as guest:`, err.message);
        return next();
      }
      if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
        return next(new AppError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
      }
      next(err);
    }
  };
};

export default auth;