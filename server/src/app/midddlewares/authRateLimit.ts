// src/app/midddlewares/authRateLimit.ts
// Rate limiting for authentication endpoints to prevent brute-force attacks

import rateLimit from "express-rate-limit";

const rateLimitResponse = (_req: any, res: any) => {
  res.status(429).json({
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  });
};

/**
 * Login rate limiter: 5 attempts per 15 minutes per IP
 * Prevents brute-force password attacks
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts, not just failures
});

/**
 * Registration rate limiter: 3 registrations per hour per IP
 * Prevents automated account creation
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset rate limiter: 3 attempts per hour per IP
 * Prevents password reset enumeration attacks
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});
