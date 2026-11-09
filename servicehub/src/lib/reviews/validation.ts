import { z } from "zod";

export const reviewCreateSchema = z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid booking."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500, "Keep the comment under 500 characters.").optional().default(""),
  clientRequestId: z.string().uuid("Invalid request id.").optional(),
});

export const reviewUpdateSchema = reviewCreateSchema.omit({ bookingId: true }).partial();
