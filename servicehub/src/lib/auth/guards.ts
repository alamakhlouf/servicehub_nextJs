import { redirect } from "next/navigation";
import { getCurrentUser } from "./users";
import type { Role } from "@/types/auth";
export async function requireUser() { const user = await getCurrentUser(); if (!user) redirect("/login"); return user; }
export async function requireRole(...roles: Role[]) { const user = await requireUser(); if (!roles.includes(user.role)) redirect("/dashboard/profile"); return user; }
