import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config/config";
import prisma from "../config/prisma";

const passwordHash = async (password: string) => {
  const saltRounds = Number(config.saltrounds);
  const hashedPassword: string = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

const comparePasswords = async (
  plainTextPassword: string,
  hashedPassword: string
) => {
  const match: boolean = await bcrypt.compare(
    plainTextPassword,
    hashedPassword
  );
  return match;
};

const createToken = (data: Record<string, unknown>): string => {
  return jwt.sign(data, config.jwt_secrets as Secret, {
    algorithm: "HS256",
    expiresIn: config.jwt_expires_in,
  });
};

const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt_secrets as Secret) as JwtPayload;
};

const calculateMeta = async (data: any) => {
  const { page = 1, limit = 10, itemType = 'found' } = data;
  
  let total;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      if (itemType === 'lost') {
        total = await prisma.lostItem.count({
          where: { isDeleted: false }
        });
      } else {
        total = await prisma.foundItem.count({
          where: { isDeleted: false }
        });
      }
      break; // Success, exit retry loop
    } catch (error: any) {
      retryCount++;
      console.error(`calculateMeta attempt ${retryCount} failed:`, error.message);
      
      if (retryCount >= maxRetries) {
        console.error('calculateMeta: Max retries reached, throwing error');
        throw new Error('Database connection failed. Please try again.');
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  const meta = {
    total: total || 0,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil((total || 0) / Number(limit)),
  };
  return meta;
};

export const utils = {
  passwordHash,
  comparePasswords,
  createToken,
  verifyToken,
  calculateMeta,
};
