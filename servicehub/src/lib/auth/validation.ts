import { z } from "zod";
import { publicRoles } from "@/types/auth";
export const signupSchema = z.object({ name: z.string().trim().min(2, "Enter your full name.").max(100), email: z.string().trim().toLowerCase().email("Enter a valid email address."), password: z.string().min(8, "Use at least 8 characters.").max(72), role: z.enum(publicRoles, { message: "Choose an account type." }) });
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address."), password: z.string().min(1, "Enter your password.") });
export const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address.") });
export const resetPasswordSchema = z.object({ token: z.string().min(1), password: z.string().min(8, "Use at least 8 characters.").max(72) });
export const profileSchema = z.object({ name: z.string().trim().min(2, "Enter your full name.").max(100), phone: z.string().trim().max(30).optional(), city: z.string().trim().max(100).optional(), bio: z.string().trim().max(500).optional() });
