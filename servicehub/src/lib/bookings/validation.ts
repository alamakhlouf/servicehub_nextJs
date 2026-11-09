import { z } from "zod";
import { bookingStatuses } from "@/types/booking";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookingCreateSchema = z.object({
  serviceId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid service."),
  requestedDate: z.string().regex(datePattern, "Use YYYY-MM-DD.").refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), "Choose a real date."),
  requestedTime: z.string().regex(timePattern, "Use a 24-hour time."),
  addressOrArea: z.string().trim().min(2, "Enter a service area.").max(200, "Keep the area under 200 characters."),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional(),
  clientRequestId: z.string().uuid("Invalid request id."),
});

export const bookingStatusSchema = z.object({
  status: z.enum(bookingStatuses),
  agreedDate: z.string().regex(datePattern, "Use YYYY-MM-DD.").optional(),
  agreedTime: z.string().regex(timePattern, "Use a 24-hour time.").optional(),
  cancellationReason: z.string().trim().max(300).optional(),
}).superRefine((value, context) => {
  if ((value.agreedDate && !value.agreedTime) || (!value.agreedDate && value.agreedTime)) context.addIssue({ code: "custom", path: ["agreedDate"], message: "Provide both the agreed date and time." });
});

export function isPastDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() < Date.now();
}

export function canTransition(from: string, to: string, actor: string) {
  if (actor === "CUSTOMER") return from === "PENDING" && to === "CANCELLED";
  return (from === "PENDING" && ["ACCEPTED", "REJECTED"].includes(to)) ||
    (from === "ACCEPTED" && ["IN_PROGRESS", "CANCELLED"].includes(to)) ||
    (from === "IN_PROGRESS" && to === "COMPLETED");
}
