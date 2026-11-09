export const publicRoles = ["CUSTOMER", "PROVIDER", "SUPPLIER"] as const;
export const allRoles = [...publicRoles, "ADMIN"] as const;
export type PublicRole = (typeof publicRoles)[number];
export type Role = (typeof allRoles)[number];
export type SafeUser = { id: string; name: string; email: string; role: Role; phone?: string; city?: string; bio?: string };
