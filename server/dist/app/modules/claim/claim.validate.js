"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemClaimSchema = void 0;
const zod_1 = require("zod");
const createClaim = zod_1.z.object({
    body: zod_1.z.object({
        foundItemId: zod_1.z.string({ required_error: "Found item ID is required" }),
        distinguishingFeatures: zod_1.z.string().optional(),
        lostDate: zod_1.z.string({ required_error: "Lost date is required" }),
        claimantName: zod_1.z.string().default(""),
        contactNumber: zod_1.z.string().default(""),
    }),
});
const updateClaim = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED"]),
    }),
});
exports.ItemClaimSchema = {
    createClaim,
    updateClaim,
};
