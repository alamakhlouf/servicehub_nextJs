import { z } from "zod";
import { attendanceStatuses, participationStatuses, skillLevels, workshopFormats, workshopStatuses } from "@/types/workshop";

const listField = z.array(z.string().trim().min(1).max(120)).max(6).default([]);

export const workshopSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1500),
  category: z.string().trim().min(2).max(50),
  location: z.string().trim().max(200).default(""),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  capacity: z.coerce.number().int().min(1).max(500),
  imageUrl: z.union([z.string().url().max(500), z.literal("")]).optional(),
  skillLevel: z.enum(skillLevels).default("ALL_LEVELS"),
  learningPoints: listField,
  requirements: z.array(z.string().trim().min(1).max(120)).max(5).default([]),
  format: z.enum(workshopFormats).default("IN_PERSON"),
  meetingUrl: z.string().url().max(500).refine((value) => value.startsWith("https://"), "Meeting link must use https://").optional().or(z.literal("")),
  status: z.enum(workshopStatuses).optional(),
}).superRefine((value, ctx) => {
  if (value.format === "IN_PERSON" && value.location.length < 2) ctx.addIssue({ code: "custom", path: ["location"], message: "Location is required for in-person workshops." });
  if (value.status === "PUBLISHED" && value.format === "ONLINE" && !value.meetingUrl) ctx.addIssue({ code: "custom", path: ["meetingUrl"], message: "A meeting link is required to publish an online workshop." });
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
