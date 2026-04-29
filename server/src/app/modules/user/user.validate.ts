import { z } from "zod";

// ── Register — now accepts schoolId instead of forcing username/email ─────────
// Students register with schoolId; username/email are optional (set by backend
// from masterlist data). Admin registration still works with username+email.
const userRegisterSchema = z.object({
  body: z.object({
    schoolId: z.string().optional(),
    username: z.string().optional(),
    name:     z.string().optional(),
    email:    z.string().optional(),
    password: z.string({
      required_error: "Password field is required",
    }),
  }),
});

// ── Login — now also accepts schoolId ─────────────────────────────────────────
const userLoginSchema = z.object({
  body: z.object({
    email:    z.string().optional(),
    username: z.string().optional(), // schoolId is sent here from StudentLogin
    password: z.string({
      required_error: "Password field is required",
    }),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: "Current password is required",
    }),
    newPassword: z.string({
      required_error: "New password field is required",
    }),
  }),
});

const changeEmailSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }),
  }),
});

const changeUsernameSchema = z.object({
  body: z.object({
    username: z.string({ required_error: "Username is required" }),
  }),
});

export const UserSchema = {
  userRegisterSchema,
  userLoginSchema,
  changePasswordSchema,
  changeEmailSchema,
  changeUsernameSchema,
};