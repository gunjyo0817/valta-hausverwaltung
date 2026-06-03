import { and, desc, eq } from "drizzle-orm";

import type { HistoryItem, LocalizedText, Role, TicketStatus } from "@/lib/api/types";
import { db } from "@/server/db/client";
import { notifications, ticketAssignments, ticketEvents, tickets } from "@/server/db/schema";
import { getTicketById } from "@/server/read/queries";
import { syncTicketDerivedCounts } from "@/server/write/consistency";
import { addDeliverySimulation } from "@/server/write/delivery";
import { requireDemoWriteRole, requireTicketEventRole } from "@/server/write/authz";

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
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);
  return ticket;
}

export async function addTicketEvent(input: AddTicketEventInput) {
  const role = requireTicketEventRole(input.type, input.role);
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
    if (input.status === "resolved") {
      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
      if (ticket?.contractorId) {
        await db
          .update(ticketAssignments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(and(eq(ticketAssignments.ticketId, input.ticketId), eq(ticketAssignments.contractorId, ticket.contractorId)));
      }
    }
    await syncTicketDerivedCounts(input.ticketId);
  }

  if (input.type === "contractor" && role === "contractor") {
    await addDeliverySimulation({
      ticketId: input.ticketId,
      channel: "in_app",
      recipient: "pm",
      subject: bi("Handwerker-Nachricht im Ticket erfasst.", "Contractor message recorded on the ticket."),
      status: "sent",
    });
  }

  return getTicketById(input.ticketId, { role });
}

export async function approveTicketReply(input: ApproveTicketReplyInput) {
  const role = requireDemoWriteRole("approve ticket reply", input.role, ["pm"]);
  await addTicketEvent({
    ticketId: input.ticketId,
    type: "manager",
    text: input.text,
    role,
    actorName: "Sarah Krüger",
  });
  await addDeliverySimulation({
    ticketId: input.ticketId,
    channel: "email",
    recipient: "tenant",
    subject: bi("Antwort der Hausverwaltung wurde zugestellt.", "Property-management reply delivered."),
    status: "sent",
  });
  await addDeliverySimulation({
    ticketId: input.ticketId,
    channel: "in_app",
    recipient: "tenant",
    subject: bi("Antwort im Mieterportal verfuegbar.", "Reply available in the tenant portal."),
    status: "read",
  });
  return getTicketById(input.ticketId, { role });
}

export async function requestMissingInfo(input: RequestMissingInfoInput) {
  const role = requireDemoWriteRole("request missing information", input.role, ["pm"]);
  const ticket = await addTicketEvent({
    ticketId: input.ticketId,
    type: "manager",
    text: input.text,
    role,
    actorName: "Sarah Krüger",
    status: "waiting",
  });
  await notifyTenantMissingInfo(input.ticketId);
  await addDeliverySimulation({
    ticketId: input.ticketId,
    channel: "email",
    recipient: "tenant",
    subject: bi("Rueckfrage mit fehlenden Angaben wurde zugestellt.", "Missing-information request delivered."),
    status: "sent",
  });
  await addDeliverySimulation({
    ticketId: input.ticketId,
    channel: "sms",
    recipient: "tenant",
    subject: bi("SMS-Hinweis zur Rueckfrage wurde versendet.", "SMS reminder for the information request sent."),
    status: "sent",
  });
  return (await getTicketById(input.ticketId, { role })) ?? ticket;
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
  const role = requireDemoWriteRole("update ticket status", input.role, ["pm", "tenant"]);
  const ticket = await ensureTicket(input.ticketId);
  if (role === "tenant" && input.status !== "resolved") {
    throw new Error("Demo authorization denied for tenant status update: tenants can only confirm resolved.");
  }

  if (ticket.status === input.status && !input.note?.trim()) {
    return getTicketById(input.ticketId, { role });
  }

  await db.update(tickets).set({ status: input.status, updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));
  if (input.status === "resolved" && ticket.contractorId) {
    await db
      .update(ticketAssignments)
      .set({ status: "completed", updatedAt: new Date() })
      .where(and(eq(ticketAssignments.ticketId, input.ticketId), eq(ticketAssignments.contractorId, ticket.contractorId)));
  }
  await syncTicketDerivedCounts(input.ticketId);

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
      role,
      actorName: "Sarah Krüger",
    });
  }

  return getTicketById(input.ticketId, { role });
}
