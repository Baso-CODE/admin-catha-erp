import * as z from "zod";

export const proposalStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "WITHDRAWN",
]);

export const createProposalSchema = z.object({
  subject: z.string().trim().min(1, { message: "Subject wajib diisi" }),

  amount: z
    .number({ message: "Amount harus berupa angka" })
    .min(0, { message: "Amount tidak boleh negatif" }),

  proposalDate: z.string().min(1, {
    message: "Tanggal proposal wajib diisi",
  }),

  validUntil: z.string().min(1, {
    message: "Tanggal berlaku wajib diisi",
  }),

  fileUrl: z.string().trim().optional(),
});

export const updateProposalSchema = createProposalSchema.extend({
  status: proposalStatusSchema,
});

export type CreateProposalFormValues = z.infer<typeof createProposalSchema>;
export type UpdateProposalFormValues = z.infer<typeof updateProposalSchema>;
