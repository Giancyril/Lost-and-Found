import { z } from "zod";

const ACCEPTED_MIME_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];
const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5 MB decoded

const imageUrlSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || ACCEPTED_MIME_PREFIXES.some((p) => val.startsWith(p)),
    { message: "Image must be JPEG, PNG, or WebP" }
  )
  .refine(
    (val) => {
      if (!val) return true;
      const base64 = val.split(",")[1] ?? "";
      return Math.ceil((base64.length * 3) / 4) <= MAX_BASE64_BYTES;
    },
    { message: "Image must be under 5 MB" }
  );

export const createPostSchema = z.object({
  body: z.object({
    itemName:     z.string().min(1).max(100).refine((s) => s.trim().length > 0, { message: "Item name cannot be blank" }),
    description:  z.string().min(10, "Description must be at least 10 characters").max(500),
    location:     z.string().min(1).max(100),
    dateLost:     z.string().refine((d) => new Date(d) <= new Date(), { message: "Date lost cannot be in the future" }),
    imageUrl:     imageUrlSchema,
    reporterName: z.string().max(80).optional(),
    contactHint:  z.string().max(100).optional(),
  }),
});

export const createTipSchema = z.object({
  body: z.object({
    details:  z.string().min(10, "Details must be at least 10 characters").max(500),
    location: z.string().optional(),
  }),
});
