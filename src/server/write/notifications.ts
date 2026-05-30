import { and, eq } from "drizzle-orm";

import type { Role } from "@/lib/api/types";
import { selectedDemoIdentity } from "@/server/auth/demo";
import { db } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { listNotifications } from "@/server/read/queries";

export type MarkNotificationReadInput = {
  id: string;
  role?: Role;
};

export type MarkAllNotificationsReadInput = {
  role?: Role;
};

export async function markNotificationRead(input: MarkNotificationReadInput) {
  const identity = selectedDemoIdentity(input);

  await db
    .update(notifications)
    .set({ unread: false, updatedAt: new Date() })
    .where(and(eq(notifications.id, input.id), eq(notifications.recipientUserId, identity.userId)));

  return listNotifications(input);
}

export async function markAllNotificationsRead(input: MarkAllNotificationsReadInput) {
  const identity = selectedDemoIdentity(input);

  await db
    .update(notifications)
    .set({ unread: false, updatedAt: new Date() })
    .where(eq(notifications.recipientUserId, identity.userId));

  return listNotifications(input);
}

