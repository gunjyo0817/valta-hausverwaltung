import { eq, sql } from "drizzle-orm";

import type { Role } from "@/lib/api/types";
import { db } from "@/server/db/client";
import {
  documents,
  notifications,
  ticketEvents,
  tickets,
} from "@/server/db/schema";
import { getPropertyById, getTicketById } from "@/server/read/queries";

export type AddDocumentMetadataInput = {
  scope: "ticket" | "property";
  targetId: string;
  name: string;
  type: string;
  url?: string | null;
  role?: Role;
};

function nowLabel(role?: Role) {
  return role === "owner" || role === "tenant" || role === "contractor" || role === "pm"
    ? { DE: "jetzt", EN: "now" }
    : { DE: "jetzt", EN: "now" };
}

async function nextTicketEventSequence(ticketId: string) {
  const [latest] = await db
    .select({ sequence: ticketEvents.sequence })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId))
    .orderBy(sql`${ticketEvents.sequence} desc`)
    .limit(1);

  return (latest?.sequence ?? 0) + 1;
}

export async function addDocumentMetadata(input: AddDocumentMetadataInput) {
  const id = `${input.scope}-${input.targetId}-doc-${Date.now()}`;
  const isTicket = input.scope === "ticket";
  const label = nowLabel(input.role);

  await db.insert(documents).values({
    id,
    propertyId: isTicket ? null : input.targetId,
    ticketId: isTicket ? input.targetId : null,
    name: input.name,
    type: input.type,
    updatedLabel: label.DE,
    url: input.url ?? null,
  });

  if (isTicket) {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.targetId)).limit(1);
    if (!ticket) throw new Error(`Ticket not found: ${input.targetId}`);

    await db
      .update(tickets)
      .set({
        photos: sql`${tickets.photos} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, input.targetId));

    const sequence = await nextTicketEventSequence(input.targetId);
    await db.insert(ticketEvents).values({
      id: `${input.targetId}-event-${sequence}`,
      ticketId: input.targetId,
      type: input.role === "tenant" ? "tenant" : "manager",
      actorName: input.role === "tenant" ? ((ticket.tenantSnapshot as { name?: string }).name ?? "Tenant") : "Sarah Krüger",
      atLabel: label,
      text: {
        DE: `Anhang hinzugefügt: ${input.name}`,
        EN: `Attachment added: ${input.name}`,
      },
      sequence,
    });

    await db
      .insert(notifications)
      .values({
        id: `${input.targetId}-attachment-${Date.now()}`,
        recipientUserId: input.role === "tenant" ? "demo-pm" : "demo-tenant",
        type: "photos",
        title: { DE: "Neuer Anhang", EN: "New attachment" },
        description: { DE: input.name, EN: input.name },
        ticketId: input.targetId,
        context: ticket.tenantSnapshot?.building as string | undefined,
        timeLabel: label,
        unread: true,
        targetPath: input.role === "tenant" ? "/ticket/$id" : "/tenant/tickets/$id",
        targetParams: { id: input.targetId },
        action: { DE: "Anhang ansehen", EN: "View attachment" },
      })
      .onConflictDoNothing();

    return getTicketById(input.targetId, { role: input.role ?? "pm" });
  }

  return getPropertyById(input.targetId, { role: input.role ?? "pm" });
}
