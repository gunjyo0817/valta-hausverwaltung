import { and, eq } from "drizzle-orm";

import type { LocalizedText, Role } from "@/lib/api/types";
import { db } from "@/server/db/client";
import {
  contractors,
  notifications,
  ticketAssignments,
  tickets,
} from "@/server/db/schema";
import { getTicketById } from "@/server/read/queries";
import { syncContractorJobCounts, syncPropertyTicketCounts } from "@/server/write/consistency";
import { addTicketEvent } from "@/server/write/ticketActions";
import { requireDemoWriteRole } from "@/server/write/authz";

type ContractorJobAction = "accept" | "start" | "request_info" | "complete";

export type ContractorJobActionInput = {
  ticketId: string;
  action: ContractorJobAction;
  message?: string;
  role?: Role;
};

function bi(de: string, en = de): LocalizedText {
  return { DE: de, EN: en };
}

async function assignedContractor(ticketId: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);
  if (!ticket.contractorId) throw new Error(`Ticket has no assigned contractor: ${ticketId}`);

  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, ticket.contractorId)).limit(1);
  if (!contractor) throw new Error(`Contractor not found: ${ticket.contractorId}`);

  return { ticket, contractor };
}

async function upsertAssignment(ticketId: string, contractorId: string, status: "accepted" | "in_progress" | "completed") {
  await db
    .insert(ticketAssignments)
    .values({
      id: `${ticketId}-${contractorId}`,
      ticketId,
      contractorId,
      status,
      assignedByUserId: "demo-pm",
    })
    .onConflictDoUpdate({
      target: ticketAssignments.id,
      set: {
        status,
        updatedAt: new Date(),
      },
    });
}

async function notifyPm(input: {
  ticketId: string;
  type: "assigned" | "status" | "missing";
  title: LocalizedText;
  description: LocalizedText;
  action: LocalizedText;
}) {
  await db
    .insert(notifications)
    .values({
      id: `${input.ticketId}-${input.type}-${Date.now()}`,
      recipientUserId: "demo-pm",
      type: input.type,
      title: input.title,
      description: input.description,
      ticketId: input.ticketId,
      context: null,
      timeLabel: bi("jetzt", "now"),
      unread: true,
      targetPath: "/ticket/$id",
      targetParams: { id: input.ticketId },
      action: input.action,
    });
}

async function notifyTenantStatus(ticketId: string, description: LocalizedText) {
  await db
    .insert(notifications)
    .values({
      id: `${ticketId}-contractor-status-tenant-${Date.now()}`,
      recipientUserId: "demo-tenant",
      type: "status",
      title: bi("Status aktualisiert", "Status updated"),
      description,
      ticketId,
      context: null,
      timeLabel: bi("jetzt", "now"),
      unread: true,
      targetPath: "/tenant/tickets/$id",
      targetParams: { id: ticketId },
      action: bi("Status ansehen", "View status"),
    });
}

export async function updateContractorJob(input: ContractorJobActionInput) {
  const role = requireDemoWriteRole("update contractor job", input.role, ["contractor"]);
  const { ticket: currentTicket, contractor } = await assignedContractor(input.ticketId);

  if (input.action === "accept") {
    const [assignment] = await db
      .select()
      .from(ticketAssignments)
      .where(and(eq(ticketAssignments.ticketId, input.ticketId), eq(ticketAssignments.contractorId, contractor.id)))
      .limit(1);
    if (assignment?.status === "accepted") {
      return getTicketById(input.ticketId, { role });
    }
    await upsertAssignment(input.ticketId, contractor.id, "accepted");
    await db
      .update(tickets)
      .set({ status: "contractor_assigned", updatedAt: new Date() })
      .where(eq(tickets.id, input.ticketId));
    const eventText = `${contractor.name}: Auftrag angenommen.`;
    const ticket = await addTicketEvent({
      ticketId: input.ticketId,
      type: "contractor",
      actorName: contractor.name,
      text: eventText,
      role,
    });
    await notifyPm({
      ticketId: input.ticketId,
      type: "assigned",
      title: bi("Handwerker hat Auftrag angenommen", "Contractor accepted job"),
      description: bi(eventText, `${contractor.name}: job accepted.`),
      action: bi("Ticket öffnen", "Open ticket"),
    });
    await syncContractorJobCounts(contractor.id);
    return ticket;
  }

  if (input.action === "start") {
    if (currentTicket.status === "in_progress") {
      return getTicketById(input.ticketId, { role });
    }
    await upsertAssignment(input.ticketId, contractor.id, "in_progress");
    const eventText = `${contractor.name}: Arbeiten gestartet.`;
    const ticket = await addTicketEvent({
      ticketId: input.ticketId,
      type: "contractor",
      actorName: contractor.name,
      text: eventText,
      status: "in_progress",
      role,
    });
    await notifyPm({
      ticketId: input.ticketId,
      type: "status",
      title: bi("Arbeiten gestartet", "Work started"),
      description: bi(eventText, `${contractor.name}: work started.`),
      action: bi("Ticket öffnen", "Open ticket"),
    });
    await notifyTenantStatus(input.ticketId, bi("Der Handwerker hat die Arbeiten gestartet.", "The contractor has started work."));
    await Promise.all([syncPropertyTicketCounts(currentTicket.propertyId), syncContractorJobCounts(contractor.id)]);
    return ticket;
  }

  if (input.action === "request_info") {
    const text = input.message?.trim() || "Bitte zusätzliche Informationen zur Ausführung senden.";
    const ticket = await addTicketEvent({
      ticketId: input.ticketId,
      type: "contractor",
      actorName: contractor.name,
      text,
      status: "waiting",
      role,
    });
    await notifyPm({
      ticketId: input.ticketId,
      type: "missing",
      title: bi("Handwerker benötigt Informationen", "Contractor needs information"),
      description: bi(text, text),
      action: bi("Prüfen", "Review"),
    });
    return ticket;
  }

  if (currentTicket.status === "resolved") {
    await upsertAssignment(input.ticketId, contractor.id, "completed");
    await Promise.all([syncPropertyTicketCounts(currentTicket.propertyId), syncContractorJobCounts(contractor.id)]);
    return getTicketById(input.ticketId, { role });
  }

  await db
    .update(ticketAssignments)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(ticketAssignments.ticketId, input.ticketId), eq(ticketAssignments.contractorId, contractor.id)));

  const eventText = input.message?.trim() || `${contractor.name}: Auftrag abgeschlossen.`;
  const ticket = await addTicketEvent({
    ticketId: input.ticketId,
    type: "contractor",
    actorName: contractor.name,
    text: eventText,
    status: "resolved",
    role,
  });
  await notifyPm({
    ticketId: input.ticketId,
    type: "status",
    title: bi("Auftrag abgeschlossen", "Job completed"),
    description: bi(eventText, eventText),
    action: bi("Ticket öffnen", "Open ticket"),
  });
  await notifyTenantStatus(input.ticketId, bi("Die Reparatur wurde als abgeschlossen markiert.", "The repair was marked complete."));
  await Promise.all([syncPropertyTicketCounts(currentTicket.propertyId), syncContractorJobCounts(contractor.id)]);

  return ticket ?? getTicketById(input.ticketId, { role });
}
