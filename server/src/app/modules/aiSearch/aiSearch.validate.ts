import { z } from "zod";

const aiSearchSchema = z.object({
  body: z.object({
    query: z.string({
      required_error: "Search query is required",
    }).min(1, "Search query cannot be empty"),
  }),
});

export const aiSearchValidation = {
  aiSearchSchema,
};
