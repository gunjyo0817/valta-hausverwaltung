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
import { requireDemoWriteRole } from "@/server/write/authz";

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

const allowedDocumentTypes = [
  "image/",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function assertDocumentMetadata(input: AddDocumentMetadataInput) {
  if (!allowedDocumentTypes.some((type) => input.type === type || input.type.startsWith(type))) {
    throw new Error(`Unsupported document type: ${input.type}`);
  }

  if (input.url && !input.url.startsWith("data:") && !input.url.startsWith("http://") && !input.url.startsWith("https://")) {
    throw new Error("Unsupported document URL.");
  }

  if (input.url && input.url.length > 14_000_000) {
    throw new Error("Document URL is too large for demo storage.");
  }
}

export async function addDocumentMetadata(input: AddDocumentMetadataInput) {
  const role = input.scope === "property"
    ? requireDemoWriteRole("add property document", input.role, ["pm"])
    : requireDemoWriteRole("add ticket attachment", input.role, ["pm", "tenant", "contractor"]);
  assertDocumentMetadata(input);

  const id = `${input.scope}-${input.targetId}-doc-${Date.now()}`;
  const isTicket = input.scope === "ticket";
  const label = nowLabel(role);

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
      type: role === "tenant" ? "tenant" : role === "contractor" ? "contractor" : "manager",
      actorName: role === "tenant" ? ((ticket.tenantSnapshot as { name?: string }).name ?? "Tenant") : role === "contractor" ? "Demo Contractor" : "Sarah Krüger",
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
        recipientUserId: role === "tenant" || role === "contractor" ? "demo-pm" : "demo-tenant",
        type: "photos",
        title: { DE: "Neuer Anhang", EN: "New attachment" },
        description: { DE: input.name, EN: input.name },
        ticketId: input.targetId,
        context: ticket.tenantSnapshot?.building as string | undefined,
        timeLabel: label,
        unread: true,
        targetPath: role === "tenant" || role === "contractor" ? "/ticket/$id" : "/tenant/tickets/$id",
        targetParams: { id: input.targetId },
        action: { DE: "Anhang ansehen", EN: "View attachment" },
      })
      .onConflictDoNothing();

    return getTicketById(input.targetId, { role });
  }

  return getPropertyById(input.targetId, { role });
}
