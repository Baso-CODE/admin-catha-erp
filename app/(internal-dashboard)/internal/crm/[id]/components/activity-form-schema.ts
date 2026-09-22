import * as z from "zod";

export const activityTypeSchema = z.enum([
  "CALL",
  "WHATSAPP",
  "EMAIL",
  "MEETING",
  "VISIT",
  "NOTE",
]);

export const activityStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

export const createActivitySchema = z.object({
  type: activityTypeSchema,

  subject: z.string().trim().min(1, { message: "Subject wajib diisi" }),

  description: z.string().trim().min(1, { message: "Deskripsi wajib diisi" }),

  result: z.string().trim().optional(),

  activityDate: z.string().min(1, {
    message: "Tanggal aktivitas wajib diisi",
  }),

  nextFollowUp: z.string().optional(),

  status: activityStatusSchema,
});

export const updateActivitySchema = createActivitySchema;

export type CreateActivityFormValues = z.infer<typeof createActivitySchema>;

export type UpdateActivityFormValues = z.infer<typeof updateActivitySchema>;
