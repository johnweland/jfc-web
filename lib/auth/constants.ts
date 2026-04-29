export const ADMIN_GROUPS = ["ADMINS", "STAFF"] as const;

export type AdminGroup = (typeof ADMIN_GROUPS)[number];
