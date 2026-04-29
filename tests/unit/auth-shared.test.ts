import { describe, expect, it } from "vitest";
import {
  getDisplayName,
  getInitials,
  getRoleLabel,
  getUserRole,
  hasAdminAccess,
  hasStaffAccess,
  isAdminUser,
  normalizeGroups,
  requiresMfaSetup,
} from "@/lib/auth/shared";

describe("normalizeGroups", () => {
  it("keeps only supported admin groups", () => {
    expect(normalizeGroups(["ADMINS", "OTHER", "STAFF"])).toEqual([
      "ADMINS",
      "STAFF",
    ]);
  });

  it("accepts a single group claim string", () => {
    expect(normalizeGroups("STAFF")).toEqual(["STAFF"]);
  });
});

describe("role helpers", () => {
  it("maps users with no admin groups to customer", () => {
    expect(getUserRole({ groups: [] })).toBe("customer");
  });

  it("maps STAFF to staff", () => {
    expect(getUserRole({ groups: ["STAFF"] })).toBe("staff");
  });

  it("maps ADMINS to admin", () => {
    expect(getUserRole({ groups: ["ADMINS"] })).toBe("admin");
  });

  it("prefers admin when both groups are present", () => {
    expect(getUserRole({ groups: ["STAFF", "ADMINS"] })).toBe("admin");
  });

  it("reports staff access for both staff and admin", () => {
    expect(hasStaffAccess({ role: "staff" })).toBe(true);
    expect(hasStaffAccess({ role: "admin" })).toBe(true);
    expect(hasStaffAccess({ role: "customer" })).toBe(false);
  });

  it("reports admin access only for admins", () => {
    expect(hasAdminAccess({ role: "admin" })).toBe(true);
    expect(hasAdminAccess({ role: "staff" })).toBe(false);
  });

  it("supports the legacy admin-capable check", () => {
    expect(isAdminUser({ role: "staff" })).toBe(true);
    expect(isAdminUser({ groups: ["ADMINS"] })).toBe(true);
    expect(isAdminUser({ groups: [] })).toBe(false);
  });

  it("requires MFA setup for staff/admin users without TOTP", () => {
    expect(
      requiresMfaSetup({
        role: "staff",
        mfa: {
          enabled: false,
          enabledMethods: [],
          hasTotp: false,
          preferredMethod: null,
        },
      }),
    ).toBe(true);

    expect(
      requiresMfaSetup({
        role: "customer",
        mfa: {
          enabled: false,
          enabledMethods: [],
          hasTotp: false,
          preferredMethod: null,
        },
      }),
    ).toBe(false);

    expect(
      requiresMfaSetup({
        role: "admin",
        mfa: {
          enabled: true,
          enabledMethods: ["TOTP"],
          hasTotp: true,
          preferredMethod: "TOTP",
        },
      }),
    ).toBe(false);
  });

  it("returns customer-friendly labels", () => {
    expect(getRoleLabel("customer")).toBe("Customer");
    expect(getRoleLabel("staff")).toBe("Staff");
    expect(getRoleLabel("admin")).toBe("Admin");
  });
});

describe("display helpers", () => {
  it("prefers a full name when present", () => {
    expect(
      getDisplayName({
        email: "customer@example.com",
        name: "Casey Walker",
      }),
    ).toBe("Casey Walker");
  });

  it("builds from first and last name when name is missing", () => {
    expect(
      getDisplayName({
        givenName: "Casey",
        familyName: "Walker",
      }),
    ).toBe("Casey Walker");
  });

  it("falls back to email local part", () => {
    expect(
      getDisplayName({
        email: "customer@example.com",
      }),
    ).toBe("customer");
  });

  it("derives initials from the display name", () => {
    expect(getInitials("Casey Walker")).toBe("CW");
    expect(getInitials("Casey")).toBe("C");
  });
});
