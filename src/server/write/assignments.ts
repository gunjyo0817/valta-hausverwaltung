import { eq, sql } from "drizzle-orm";

import type { LocalizedText, Role } from "@/lib/api/types";
import { db } from "@/server/db/client";
import {
  contractors,
  notifications,
  ticketAssignments,
  ticketEvents,
  tickets,
} from "@/server/db/schema";
import { getTicketById } from "@/server/read/queries";
import { syncContractorJobCounts, syncPropertyTicketCounts } from "@/server/write/consistency";
import { addDeliverySimulation } from "@/server/write/delivery";
import { defaultScheduledFor, recordScheduleEvent } from "@/server/write/schedule";
import { requireDemoWriteRole } from "@/server/write/authz";

export type AssignContractorInput = {
  ticketId: string;
  contractorId: string;
  scheduledFor?: string;
  role?: Role;
};

function bi(de: string, en = de): LocalizedText {
  return { DE: de, EN: en };
}

async function nextEventSequence(ticketId: string) {
  const [latest] = await db
    .select({ sequence: ticketEvents.sequence })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId))
    .orderBy(sql`${ticketEvents.sequence} desc`)
    .limit(1);

  return (latest?.sequence ?? 0) + 1;
}

export async function assignContractor(input: AssignContractorInput) {
  const role = requireDemoWriteRole("assign contractor", input.role, ["pm"]);
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
  if (!ticket) throw new Error(`Ticket not found: ${input.ticketId}`);

  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, input.contractorId)).limit(1);
  if (!contractor) throw new Error(`Contractor not found: ${input.contractorId}`);
  const alreadyAssignedToContractor = ticket.contractorId === contractor.id;
  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : defaultScheduledFor(contractor.etaHours);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("Invalid appointment date.");
  }

  await db
    .update(tickets)
    .set({
      contractorId: contractor.id,
      contractorName: contractor.name,
      status: "contractor_assigned",
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticket.id));

  await db
    .insert(ticketAssignments)
    .values({
      id: `${ticket.id}-${contractor.id}`,
      ticketId: ticket.id,
      contractorId: contractor.id,
      status: "assigned",
      etaHours: contractor.etaHours,
      scheduledFor,
      assignedByUserId: "demo-pm",
    })
    .onConflictDoUpdate({
      target: ticketAssignments.id,
      set: {
        status: "assigned",
        etaHours: contractor.etaHours,
        scheduledFor,
        updatedAt: new Date(),
      },
    });

  await Promise.all([
    syncPropertyTicketCounts(ticket.propertyId),
    syncContractorJobCounts(ticket.contractorId),
    syncContractorJobCounts(contractor.id),
  ]);

  if (alreadyAssignedToContractor) {
    await recordScheduleEvent(ticket.id, scheduledFor);
    return getTicketById(ticket.id, { role });
  }

  const sequence = await nextEventSequence(ticket.id);
  await db.insert(ticketEvents).values({
    id: `${ticket.id}-event-${sequence}`,
    ticketId: ticket.id,
    type: "manager",
    actorName: "Sarah Krüger",
    atLabel: bi("jetzt", "now"),
    text: bi(
      `${contractor.name} beauftragt. ETA ${contractor.etaHours} Std.`,
      `${contractor.name} dispatched. ETA ${contractor.etaHours} h.`,
    ),
    sequence,
  });

  const notificationBase = `${ticket.id}-assigned-${contractor.id}`;
  await db
    .insert(notifications)
    .values([
      {
        id: `${notificationBase}-contractor`,
        recipientUserId: contractor.userId ?? "demo-contractor",
        type: "assigned",
        title: bi("Neuer Auftrag zugewiesen", "New job assigned"),
        description: bi(`${ticket.id} · ${ticket.title.DE}`, `${ticket.id} · ${ticket.title.EN}`),
        ticketId: ticket.id,
        context: contractor.name,
        timeLabel: bi("jetzt", "now"),
        unread: true,
        targetPath: "/contractor",
        targetParams: null,
        action: bi("Auftrag öffnen", "Open job"),
      },
      {
        id: `${notificationBase}-tenant`,
        recipientUserId: "demo-tenant",
        type: "assigned",
        title: bi("Handwerker beauftragt", "Contractor dispatched"),
        description: bi(`${contractor.name} wurde informiert.`, `${contractor.name} has been notified.`),
        ticketId: ticket.id,
        context: ticket.tenantSnapshot?.building as string | undefined,
        timeLabel: bi("jetzt", "now"),
        unread: true,
        targetPath: "/tenant/tickets/$id",
        targetParams: { id: ticket.id },
        action: bi("Status ansehen", "View status"),
      },
    ])
    .onConflictDoNothing();

  await addDeliverySimulation({
    ticketId: ticket.id,
    channel: "email",
    recipient: "contractor",
    subject: bi(
      `Auftragszusammenfassung an ${contractor.name} gesendet.`,
      `Job summary sent to ${contractor.name}.`,
    ),
    status: "sent",
  });
  await addDeliverySimulation({
    ticketId: ticket.id,
    channel: "sms",
    recipient: "contractor",
    subject: bi(
      `SMS-Hinweis an ${contractor.name} versendet.`,
      `SMS alert sent to ${contractor.name}.`,
    ),
    status: "sent",
  });
  await addDeliverySimulation({
    ticketId: ticket.id,
    channel: "in_app",
    recipient: "tenant",
    subject: bi("Mieterportal ueber Handwerkerbeauftragung aktualisiert.", "Tenant portal updated with contractor assignment."),
    status: "read",
  });
  await recordScheduleEvent(ticket.id, scheduledFor);

  return getTicketById(ticket.id, { role });
}
