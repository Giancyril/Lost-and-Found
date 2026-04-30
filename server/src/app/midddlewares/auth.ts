import { NextFunction, Request, Response } from "express";
import { utils } from "../utils/utils";
import AppError from "../global/error";
import { StatusCodes } from "http-status-codes";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      console.log(`[DEBUG] Auth middleware - Auth header:`, authHeader ? authHeader.substring(0, 50) + '...' : 'No auth header');
      console.log(`[DEBUG] Auth middleware - Headers:`, Object.keys(req.headers));
      
      if (!authHeader) {
        console.log(`[DEBUG] Auth middleware - No authorization header found`);
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
      }
      
      // Extract token from "Bearer <token>" format
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) // Remove "Bearer " prefix
        : authHeader;
      
      console.log(`[DEBUG] Auth middleware - Extracted token:`, token ? token.substring(0, 50) + '...' : 'No token');
      
      const verifiedUser = utils.verifyToken(token);
      console.log(`[DEBUG] Auth middleware - Verified user:`, verifiedUser);
      req.user = verifiedUser;

      if (!verifiedUser) {
        console.log(`[DEBUG] Auth middleware - Token verification failed`);
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
      }

      // if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
      //   throw new AppError(StatusCodes.FORBIDDEN, "Forbidden");
      // }

      console.log(`[DEBUG] Auth middleware - Success for user:`, verifiedUser.id, verifiedUser.email);
      next();
    } catch (err: any) {
      console.log(`[DEBUG] Auth middleware - Error:`, err.message, err.name);
      if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
        return next(new AppError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
      }
      next(err);
    }
  };
};

export default auth;
