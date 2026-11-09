import { z } from "zod";
import { attendanceStatuses, participationStatuses, workshopStatuses } from "@/types/workshop";

export const workshopSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1500),
  category: z.string().trim().min(2).max(50),
  location: z.string().trim().min(2).max(200),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  capacity: z.coerce.number().int().min(1).max(500),
  imageUrl: z.union([z.string().url().max(500), z.literal("")]).optional(),
  status: z.enum(workshopStatuses).optional(),
});

export const participationSchema = z.object({
  note: z.string().trim().max(500).optional().default(""),
  clientRequestId: z.string().uuid().optional(),
});

export const participantUpdateSchema = z.object({
  status: z.enum(participationStatuses).optional(),
  attendance: z.enum(attendanceStatuses).optional(),
});

export function durationMinutes(startAt: string, endAt: string) {
  return Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
}
