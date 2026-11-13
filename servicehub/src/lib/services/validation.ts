import { z } from "zod";
import { servicePriceUnits, serviceStatuses } from "@/types/service";

export const serviceSchema = z.object({
  title: z.string().trim().min(2, "Enter a service title.").max(100, "Keep the title under 100 characters."),
  category: z.string().trim().min(2, "Choose a category.").max(50, "Keep the category under 50 characters."),
  description: z.string().trim().min(10, "Add a little more detail.").max(1000, "Keep the description under 1,000 characters."),
  price: z.coerce.number().finite("Enter a valid price.").min(0, "Price cannot be negative."),
  priceUnit: z.enum(servicePriceUnits, { message: "Choose a price unit." }),
  city: z.string().trim().min(2, "Enter a city or area.").max(100, "Keep the area under 100 characters."),
  imageUrl: z.union([z.string().url("Enter a valid image URL."), z.literal("")]).optional(),
  status: z.enum(serviceStatuses).optional(),
});

export const serviceQuerySchema = z.object({
  category: z.string().trim().max(50).optional(),
  q: z.string().trim().max(100).optional(),
});

export const serviceUpdateSchema = serviceSchema.partial();
