import type { Role } from "@/lib/api/types";

export const DEMO_ORG_ID = "org-hausverwaltung-berlin";

export const DEMO_IDENTITIES: Record<
  Role,
  {
    userId: string;
    role: Role;
    tenantId?: string;
    tenantName?: string;
    propertyIds?: string[];
    contractorId?: string;
  }
> = {
  pm: {
    userId: "demo-pm",
    role: "pm",
  },
  tenant: {
    userId: "demo-tenant",
    role: "tenant",
    tenantId: "tenant-anna-becker-p-lindenstr-22",
    tenantName: "Anna Becker",
    propertyIds: ["p-lindenstr-22"],
  },
  contractor: {
    userId: "demo-contractor",
    role: "contractor",
    contractorId: "c1",
    propertyIds: ["p-lindenstr-22"],
  },
  owner: {
    userId: "demo-owner",
    role: "owner",
  },
};

export function demoIdentity(role: Role) {
  return DEMO_IDENTITIES[role];
}
