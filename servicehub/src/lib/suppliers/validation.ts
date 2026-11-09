import { z } from "zod";
import { supplierOrderStatuses } from "@/types/supplier";

export const supplierListingSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name.").max(100, "Keep the name under 100 characters."),
  category: z.string().trim().min(2, "Choose a category.").max(50, "Keep the category under 50 characters."),
  description: z.string().trim().min(10, "Add a little more detail.").max(1000, "Keep the description under 1,000 characters."),
  unitPrice: z.coerce.number().finite("Enter a valid price.").min(0, "Price cannot be negative."),
  unitLabel: z.string().trim().min(1, "Enter a unit label.").max(30, "Keep the unit label short."),
  stock: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock cannot be negative."),
  available: z.boolean(),
});

export const supplierListingUpdateSchema = supplierListingSchema.partial();

export const supplierQuerySchema = z.object({
  category: z.string().trim().max(50).optional(),
  q: z.string().trim().max(100).optional(),
});

export const supplierOrderSchema = z.object({
  listingId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid product."),
  quantity: z.coerce.number().int("Quantity must be a whole number.").positive("Enter at least one item."),
  contactName: z.string().trim().min(2, "Enter a contact name.").max(100),
  contactPhone: z.string().trim().min(3, "Enter a contact phone.").max(30),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional(),
});

export const supplierOrderStatusSchema = z.object({ status: z.enum(supplierOrderStatuses) });
