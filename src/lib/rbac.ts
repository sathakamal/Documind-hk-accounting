export type Role = "USER" | "ADMIN";

export const ROLES: Role[] = ["USER", "ADMIN"];

export function requireRole(session: any, requiredRole: Role): boolean {
  const userRole = session?.user?.role as Role;
  if (!userRole) return false;
  
  if (requiredRole === "ADMIN") {
    return userRole === "ADMIN";
  }
  
  return ROLES.includes(userRole);
}

export function isAdmin(session: any): boolean {
  return requireRole(session, "ADMIN");
}