"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTipSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
const ACCEPTED_MIME_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];
const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5 MB decoded
const imageUrlSchema = zod_1.z
    .string()
    .optional()
    .refine((val) => !val || ACCEPTED_MIME_PREFIXES.some((p) => val.startsWith(p)), { message: "Image must be JPEG, PNG, or WebP" })
    .refine((val) => {
    var _a;
    if (!val)
        return true;
    const base64 = (_a = val.split(",")[1]) !== null && _a !== void 0 ? _a : "";
    return Math.ceil((base64.length * 3) / 4) <= MAX_BASE64_BYTES;
}, { message: "Image must be under 5 MB" });
exports.createPostSchema = zod_1.z.object({
    body: zod_1.z.object({
        itemName: zod_1.z.string().min(1).max(100).refine((s) => s.trim().length > 0, { message: "Item name cannot be blank" }),
        description: zod_1.z.string().min(10, "Description must be at least 10 characters").max(500),
        location: zod_1.z.string().min(1).max(100),
        dateLost: zod_1.z.string().refine((d) => new Date(d) <= new Date(), { message: "Date lost cannot be in the future" }),
        imageUrl: imageUrlSchema,
        reporterName: zod_1.z.string().max(80).optional(),
        contactHint: zod_1.z.string().max(100).optional(),
    }),
});
exports.createTipSchema = zod_1.z.object({
    body: zod_1.z.object({
        details: zod_1.z.string().min(10, "Details must be at least 10 characters").max(500),
        location: zod_1.z.string().optional(),
    }),
});
