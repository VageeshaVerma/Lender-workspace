import { SessionPayload } from "./session";

export function requireSuperAdmin(session: SessionPayload) {
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
}

export function isSuperAdmin(session: SessionPayload | null) {
  return session?.role === "super_admin";
}

export function canAccessAllLenders(session: SessionPayload) {
  return (
    session.role === "super_admin" ||
    session.role === "ops_admin"
  );
}