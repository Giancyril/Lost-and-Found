"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSearchValidation = void 0;
const zod_1 = require("zod");
const aiSearchSchema = zod_1.z.object({
    body: zod_1.z.object({
        query: zod_1.z.string({
            required_error: "Search query is required",
        }).min(1, "Search query cannot be empty"),
    }),
});
exports.aiSearchValidation = {
    aiSearchSchema,
};
