import { desc, eq } from "drizzle-orm";

import type { LocalizedText, Role } from "@/lib/api/types";
import { db } from "@/server/db/client";
import { notifications, ticketAssignments, ticketEvents, tickets } from "@/server/db/schema";
import { getTicketById } from "@/server/read/queries";
import { requireDemoWriteRole } from "@/server/write/authz";

export type RescheduleAppointmentInput = {
  ticketId: string;
  scheduledFor: string;
  etaHours?: number | null;
  role?: Role;
};

function bi(de: string, en = de): LocalizedText {
  return { DE: de, EN: en };
}

export function defaultScheduledFor(etaHours?: number | null) {
  const date = new Date();
  date.setHours(date.getHours() + Math.max(etaHours ?? 2, 1));
  date.setMinutes(0, 0, 0);
  return date;
}

function formatSchedule(date: Date): LocalizedText {
  return {
    DE: new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    }).format(date),
    EN: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    }).format(date),
  };
}

async function nextEventSequence(ticketId: string) {
  const [latest] = await db
    .select({ sequence: ticketEvents.sequence })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId))
    .orderBy(desc(ticketEvents.sequence))
    .limit(1);

  return (latest?.sequence ?? 0) + 1;
}

export async function recordScheduleEvent(ticketId: string, scheduledFor: Date, actorName = "Sarah Krüger") {
  const label = formatSchedule(scheduledFor);
  const sequence = await nextEventSequence(ticketId);

  await db.insert(ticketEvents).values({
    id: `${ticketId}-schedule-${sequence}`,
    ticketId,
    type: "system",
    actorName,
    atLabel: bi("jetzt", "now"),
    text: {
      DE: `Termin geplant: ${label.DE}.`,
      EN: `Appointment scheduled: ${label.EN}.`,
    },
    sequence,
  });

  await db
    .insert(notifications)
    .values({
      id: `${ticketId}-schedule-${scheduledFor.getTime()}`,
      recipientUserId: "demo-tenant",
      type: "status",
      title: bi("Termin aktualisiert", "Appointment updated"),
      description: {
        DE: `Geplanter Termin: ${label.DE}`,
        EN: `Scheduled appointment: ${label.EN}`,
      },
      ticketId,
      context: null,
      timeLabel: bi("jetzt", "now"),
      unread: true,
      targetPath: "/tenant/tickets/$id",
      targetParams: { id: ticketId },
      action: bi("Termin ansehen", "View appointment"),
    })
    .onConflictDoNothing();
}

export async function rescheduleAppointment(input: RescheduleAppointmentInput) {
  const role = requireDemoWriteRole("reschedule appointment", input.role, ["pm", "contractor"]);
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
  if (!ticket) throw new Error(`Ticket not found: ${input.ticketId}`);
  if (!ticket.contractorId) throw new Error(`Ticket has no assigned contractor: ${input.ticketId}`);

  const scheduledFor = new Date(input.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("Invalid appointment date.");
  }

  await db
    .update(ticketAssignments)
    .set({
      scheduledFor,
      etaHours: input.etaHours ?? null,
      updatedAt: new Date(),
    })
    .where(eq(ticketAssignments.id, `${ticket.id}-${ticket.contractorId}`));

  await recordScheduleEvent(ticket.id, scheduledFor);
  return getTicketById(ticket.id, { role });
}
