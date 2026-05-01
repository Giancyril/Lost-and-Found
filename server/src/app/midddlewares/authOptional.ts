import { NextFunction, Request, Response } from "express";
import { utils } from "../utils/utils";

// Like auth() but never blocks — sets req.user if a valid token is present,
// otherwise continues as anonymous. Used for routes that allow both.
const authOptional = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return next(); // no token → anonymous

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      const verifiedUser = utils.verifyToken(token);
      if (verifiedUser) req.user = verifiedUser;
    } catch {
      // invalid/expired token → treat as anonymous, don't block
    }
    next();
  };
};

export default authOptional;