import { z } from "zod";
import { reportReasons, reportStatuses, reportTargetTypes } from "@/types/report";

export const reportCreateSchema = z.object({
  targetType: z.enum(reportTargetTypes),
  targetId: z.string().regex(/^[a-f\d]{24}$/i, "Choose valid content."),
  reason: z.enum(reportReasons),
  note: z.string().trim().max(500, "Keep the description under 500 characters.").optional().default(""),
  clientRequestId: z.string().uuid("Invalid request id.").optional(),
});

export const reportStatusSchema = z.object({
  status: z.enum(reportStatuses).refine((value) => value === "UNDER_REVIEW" || value === "RESOLVED" || value === "DISMISSED", "Choose a moderation status."),
  adminNote: z.string().trim().max(500, "Keep the moderation note under 500 characters.").optional(),
});
