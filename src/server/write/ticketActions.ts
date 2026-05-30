import { desc, eq } from "drizzle-orm";

import type { HistoryItem, LocalizedText, Role, TicketStatus } from "@/lib/api/types";
import { db } from "@/server/db/client";
import { notifications, ticketEvents, tickets } from "@/server/db/schema";
import { getTicketById } from "@/server/read/queries";

type TicketEventType = HistoryItem["type"];

export type AddTicketEventInput = {
  ticketId: string;
  type: TicketEventType;
  text: string;
  role?: Role;
  actorName?: string;
  status?: TicketStatus;
};

export type ApproveTicketReplyInput = {
  ticketId: string;
  text: string;
  role?: Role;
};

export type RequestMissingInfoInput = {
  ticketId: string;
  text: string;
  role?: Role;
};

export type UpdateTicketStatusInput = {
  ticketId: string;
  status: TicketStatus;
  role?: Role;
  note?: string;
};

function bi(de: string, en = de): LocalizedText {
  return { DE: de, EN: en };
}

function actorName(type: TicketEventType, fallback?: string) {
  if (fallback) return fallback;
  if (type === "ai") return "Valta AI";
  if (type === "manager" || type === "system") return "Sarah Krüger";
  return null;
}

async function nextSequence(ticketId: string) {
  const [latest] = await db
    .select({ sequence: ticketEvents.sequence })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId))
    .orderBy(desc(ticketEvents.sequence))
    .limit(1);

  return (latest?.sequence ?? 0) + 1;
}

async function ensureTicket(ticketId: string) {
  const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);
}

export async function addTicketEvent(input: AddTicketEventInput) {
  await ensureTicket(input.ticketId);

  const sequence = await nextSequence(input.ticketId);
  await db.insert(ticketEvents).values({
    id: `${input.ticketId}-event-${sequence}`,
    ticketId: input.ticketId,
    type: input.type,
    actorName: actorName(input.type, input.actorName),
    atLabel: bi("jetzt", "now"),
    text: bi(input.text, input.text),
    sequence,
  });

  if (input.status) {
    await db.update(tickets).set({ status: input.status, updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));
  }

  return getTicketById(input.ticketId, { role: input.role ?? "pm" });
}

export function approveTicketReply(input: ApproveTicketReplyInput) {
  return addTicketEvent({
    ticketId: input.ticketId,
    type: "manager",
    text: input.text,
    role: input.role,
    actorName: "Sarah Krüger",
  });
}

export async function requestMissingInfo(input: RequestMissingInfoInput) {
  const ticket = await addTicketEvent({
    ticketId: input.ticketId,
    type: "manager",
    text: input.text,
    role: input.role,
    actorName: "Sarah Krüger",
    status: "waiting",
  });
  await notifyTenantMissingInfo(input.ticketId);
  return ticket;
}

export async function notifyTenantMissingInfo(ticketId: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) return;

  await db
    .insert(notifications)
    .values({
      id: `${ticketId}-missing-info-tenant`,
      recipientUserId: "demo-tenant",
      type: "missing",
      title: bi("Rückfrage zu Ihrer Meldung", "Question about your request"),
      description: bi("Bitte ergänzen Sie fehlende Informationen.", "Please add missing information."),
      ticketId,
      context: ticket.tenantSnapshot?.building as string | undefined,
      timeLabel: bi("jetzt", "now"),
      unread: true,
      targetPath: "/tenant/tickets/$id",
      targetParams: { id: ticketId },
      action: bi("Antworten", "Reply"),
    })
    .onConflictDoUpdate({
      target: notifications.id,
      set: {
        unread: true,
        updatedAt: new Date(),
      },
    });
}

export async function updateTicketStatus(input: UpdateTicketStatusInput) {
  await ensureTicket(input.ticketId);

  await db.update(tickets).set({ status: input.status, updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));

  await db
    .insert(notifications)
    .values({
      id: `${input.ticketId}-status-${input.status}`,
      recipientUserId: "demo-tenant",
      type: "status",
      title: bi("Ticket-Status geändert", "Ticket status changed"),
      description: bi(`Status: ${input.status}`, `Status: ${input.status}`),
      ticketId: input.ticketId,
      context: null,
      timeLabel: bi("jetzt", "now"),
      unread: true,
      targetPath: "/tenant/tickets/$id",
      targetParams: { id: input.ticketId },
      action: bi("Status ansehen", "View status"),
    })
    .onConflictDoUpdate({
      target: notifications.id,
      set: {
        unread: true,
        updatedAt: new Date(),
      },
    });

  if (input.note?.trim()) {
    return addTicketEvent({
      ticketId: input.ticketId,
      type: "system",
      text: input.note.trim(),
      role: input.role,
      actorName: "Sarah Krüger",
    });
  }

  return getTicketById(input.ticketId, { role: input.role ?? "pm" });
}
