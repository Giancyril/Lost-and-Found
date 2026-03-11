import { z } from "zod";

const createClaim = z.object({
  body: z.object({
    foundItemId: z.string({ required_error: "Found item ID is required" }),
    distinguishingFeatures: z.string().optional(),
    lostDate: z.string({ required_error: "Lost date is required" }),
    claimantName: z.string().default(""),
    contactNumber: z.string().default(""),
  }),
});

const updateClaim = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  }),
});

export const ItemClaimSchema = {
  createClaim,
  updateClaim,
};