import rateLimit from "express-rate-limit";

const rateLimitResponse = (_req: any, res: any) => {
  res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
};

export const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

export const tipSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});
