// src/app/midddlewares/authRateLimit.ts
// Rate limiting for authentication endpoints to prevent brute-force attacks

import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

const rateLimitResponse = (_req: any, res: any) => {
  res.status(429).json({
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  });
};

/**
 * Login rate limiter:
 *   - Production: 10 failed attempts per 15 minutes per IP
 *   - Development: 100 attempts per 15 minutes (effectively unlimited during dev)
 *
 * skipSuccessfulRequests: true — only failed/blocked requests count toward the limit.
 * A successful login does NOT eat into the quota, so normal dev workflow is never blocked.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,            // 15-minute window
  max: isDev ? 100 : 10,               // 100 in dev, 10 in prod
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,        // ✅ Only count FAILED attempts (correct security behaviour)
});

/**
 * Registration rate limiter:
 *   - Production: 3 registrations per hour per IP
 *   - Development: 50 per hour (won't block dev testing)
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 3,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Password reset rate limiter: 3 attempts per hour per IP (production)
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 3,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});
