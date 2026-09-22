import * as z from "zod";

export const leadStatusSchema = z.enum([
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const createLeadSchema = z.object({
  company: z.string().min(1, { message: "Nama perusahaan wajib diisi" }),
  pic: z.string().min(1, { message: "PIC wajib diisi" }),
  phone: z.string().min(1, { message: "Nomor telepon wajib diisi" }),
  email: z
    .string()
    .email({ message: "Format email tidak valid" })
    .or(z.literal("")),
  industry: z.string().optional(),
  address: z.string().optional(),
  estimatedValue: z
    .number()
    .min(0, { message: "Estimated value tidak boleh negatif" })
    .optional(),
  source: z.string().optional(),
  assigneeId: z.string().min(1, { message: "Sales assignee wajib dipilih" }),
});

export const updateLeadSchema = createLeadSchema.extend({
  status: leadStatusSchema,
});

export type CreateLeadFormValues = z.infer<typeof createLeadSchema>;
export type UpdateLeadFormValues = z.infer<typeof updateLeadSchema>;
