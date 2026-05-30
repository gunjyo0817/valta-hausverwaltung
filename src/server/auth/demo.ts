import { eq } from "drizzle-orm";

import type { DemoUserDto, Role } from "@/lib/api/types";
import { demoIdentity } from "@/lib/demoIdentity";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export type DemoRoleContext = {
  role?: Role;
};

export function selectedDemoIdentity(context?: DemoRoleContext) {
  return demoIdentity(context?.role ?? "pm");
}

export async function getDemoUser(context?: DemoRoleContext): Promise<DemoUserDto | null> {
  const identity = selectedDemoIdentity(context);
  const [user] = await db.select().from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return null;

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone,
    preferredLanguage: user.preferredLanguage === "EN" ? "EN" : "DE",
    role: identity.role,
    initials: user.initials,
    meta: user.meta as DemoUserDto["meta"],
  };
}

