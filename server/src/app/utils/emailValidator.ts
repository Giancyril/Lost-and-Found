// src/app/utils/emailValidator.ts
// Email domain validation to prevent bypass attempts

/**
 * Validates that an email belongs to the allowed domain (nbsc.edu.ph)
 * Prevents common bypass techniques:
 * - Subdomain injection: user@nbsc.edu.ph.evil.com
 * - Null byte injection: user@nbsc.edu.ph%00@evil.com
 * - Unicode homoglyphs
 * - Comment injection: user@nbsc.edu.ph(comment)@evil.com
 */
export const validateNBSCEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  // Normalize: trim whitespace and convert to lowercase
  email = email.trim().toLowerCase();

  // ✅ SECURITY: Check for null byte injection
  if (email.includes('\u0000') || email.includes('%00')) {
    return { valid: false, error: "Invalid email format (null byte detected)" };
  }

  // ✅ SECURITY: Check for multiple @ symbols (comment injection)
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, error: "Invalid email format (multiple @ symbols)" };
  }

  // ✅ SECURITY: Basic RFC 5322 email regex (simplified)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // ✅ SECURITY: Extract domain and validate exact match
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid email format" };
  }

  const [localPart, domain] = parts;

  // ✅ SECURITY: Validate local part (no dangerous characters)
  if (localPart.length > 64 || localPart.length === 0) {
    return { valid: false, error: "Invalid email username length" };
  }

  // ✅ SECURITY: Domain must be EXACTLY "nbsc.edu.ph" or "student.nbsc.edu.ph"
  const allowedDomains = ['nbsc.edu.ph', 'student.nbsc.edu.ph'];
  if (!allowedDomains.includes(domain)) {
    return { valid: false, error: "Email must be from @nbsc.edu.ph or @student.nbsc.edu.ph" };
  }

  // ✅ SECURITY: Check for homograph attacks (non-ASCII characters)
  if (!/^[\x00-\x7F]*$/.test(email)) {
    return { valid: false, error: "Invalid email format (non-ASCII characters detected)" };
  }

  return { valid: true };
};

/**
 * Middleware to validate NBSC email in registration/auth endpoints
 */
export const validateNBSCEmailMiddleware = (fieldName: string = 'email') => {
  return (req: any, res: any, next: any) => {
    const email = req.body[fieldName];
    const validation = validateNBSCEmail(email);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }
    
    next();
  };
};
