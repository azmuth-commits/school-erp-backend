import { z } from "zod";

export const payFeeSchema = z.object({
  amount: z.number().positive(),
});
