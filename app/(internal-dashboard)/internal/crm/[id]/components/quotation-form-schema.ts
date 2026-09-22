import * as z from "zod";

export const quotationStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "WITHDRAWN",
]);

export const createQuotationSchema = z.object({
  amount: z
    .number({
      message: "Amount harus berupa angka",
    })
    .min(0, {
      message: "Amount tidak boleh negatif",
    }),
});

export const updateQuotationSchema = createQuotationSchema.extend({
  status: quotationStatusSchema,
});

export type CreateQuotationFormValues = z.infer<typeof createQuotationSchema>;

export type UpdateQuotationFormValues = z.infer<typeof updateQuotationSchema>;
