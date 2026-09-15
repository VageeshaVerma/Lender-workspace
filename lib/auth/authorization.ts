import { SessionPayload, UserRole } from "./session";

export function hasRole(
  session: SessionPayload,
  allowedRoles: UserRole[]
) {
  return allowedRoles.includes(session.role);
}

export function isOpsAdmin(session: SessionPayload) {
  return session.role === "ops_admin";
}

export function isLenderAdmin(session: SessionPayload) {
  return session.role === "lender_admin";
}

export function isLenderAgent(session: SessionPayload) {
  return session.role === "lender_agent";
}

export function canAssignLeads(session: SessionPayload) {
  return (
    session.role === "ops_admin" ||
    session.role === "lender_admin"
  );
}

export function canMakeDecision(session: SessionPayload) {
  return (
    session.role === "ops_admin" ||
    session.role === "lender_admin"
  );
}

export function canDisburse(session: SessionPayload) {
  return (
    session.role === "ops_admin" ||
    session.role === "lender_admin"
  );
}

export function canManageUsers(session: SessionPayload) {
  return (
    session.role === "ops_admin" ||
    session.role === "lender_admin"
  );
}

export function canCreateLender(session: SessionPayload) {
  return session.role === "ops_admin";
}

export function canRecordCallActivity(session: SessionPayload) {
  return (
    session.role === "ops_admin" ||
    session.role === "lender_admin" ||
    session.role === "lender_agent"
  );
}