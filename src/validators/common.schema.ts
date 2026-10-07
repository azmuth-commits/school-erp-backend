import { z } from "zod";

export const idParam = z.object({ id: z.string().uuid() });
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});
