import { NextResponse } from "next/server";
import { getCurrentUser } from "./users";
import type { Role, SafeUser } from "@/types/auth";

export async function apiUser(roles?: Role[], deniedMessage = "You do not have permission for this action."): Promise<SafeUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (roles && !roles.includes(user.role)) return NextResponse.json({ error: deniedMessage }, { status: 403 });
  return user;
}

export function isApiError(value: SafeUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
