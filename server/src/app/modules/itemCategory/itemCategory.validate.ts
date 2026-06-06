import { z } from "zod";
const createFoundItemCategory = z.object({
  body: z.object({
    name: z.string({
      required_error: "Category name field is required",
    }),
    icon: z.string().optional(),
  }),
});

export const FoundItemCategorySchema = {
  createFoundItemCategory,
};
