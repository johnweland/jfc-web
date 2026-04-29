import { ADMIN_GROUPS, type AdminGroup } from "@/lib/auth/constants";

export type AuthMfaMethod = "EMAIL" | "SMS" | "TOTP";
export type AuthRole = "customer" | "staff" | "admin";

export interface AuthMfaState {
  enabled: boolean;
  enabledMethods: AuthMfaMethod[];
  hasTotp: boolean;
  preferredMethod: AuthMfaMethod | null;
}

export interface AuthUserState {
  email: string | null;
  groups: AdminGroup[];
  isSignedIn: boolean;
  mfa: AuthMfaState;
  role: AuthRole;
  username: string | null;
}

export interface AccountUserState extends AuthUserState {
  displayName: string;
  emailVerified: boolean;
  familyName: string | null;
  givenName: string | null;
  initials: string;
}

export function getDisplayName(input: {
  email?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  name?: string | null;
  preferredUsername?: string | null;
  username?: string | null;
}) {
  const fullName = input.name?.trim();

  if (fullName) {
    return fullName;
  }

  const fromParts = [input.givenName?.trim(), input.familyName?.trim()]
    .filter(Boolean)
    .join(" ");

  if (fromParts) {
    return fromParts;
  }

  if (input.preferredUsername?.trim()) {
    return input.preferredUsername.trim();
  }

  if (input.username?.trim()) {
    return input.username.trim();
  }

  if (input.email?.trim()) {
    return input.email.split("@")[0];
  }

  return "Account User";
}

export function getInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "AU";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function normalizeGroups(value: unknown): AdminGroup[] {
  const groups = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  return groups.filter((group): group is AdminGroup =>
    ADMIN_GROUPS.includes(group as AdminGroup)
  );
}

export function getUserRole(user: Pick<AuthUserState, "groups"> | null | undefined): AuthRole {
  if (user?.groups.includes("ADMINS")) {
    return "admin";
  }

  if (user?.groups.includes("STAFF")) {
    return "staff";
  }

  return "customer";
}

export function getRoleLabel(role: AuthRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "staff":
      return "Staff";
    default:
      return "Customer";
  }
}

export function hasAdminAccess(user: Pick<AuthUserState, "role"> | null | undefined) {
  return user?.role === "admin";
}

export function hasStaffAccess(user: Pick<AuthUserState, "role"> | null | undefined) {
  return user?.role === "admin" || user?.role === "staff";
}

export function isAdminUser(
  user: Pick<AuthUserState, "role"> | Pick<AuthUserState, "groups"> | null | undefined
) {
  if (!user) {
    return false;
  }

  if ("role" in user) {
    return hasStaffAccess(user);
  }

  return hasStaffAccess({ role: getUserRole(user) });
}

export function requiresMfaSetup(
  user:
    | Pick<AuthUserState, "role" | "mfa">
    | Pick<AuthUserState, "groups" | "mfa">
    | null
    | undefined
) {
  if (!user) {
    return false;
  }

  const role = "role" in user ? user.role : getUserRole(user);

  return hasStaffAccess({ role }) && !user.mfa.hasTotp;
}
