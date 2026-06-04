import { eq } from "drizzle-orm";

import { isCriticalTicket, isOpenTicket, isResolvedTicket } from "@/lib/ticketStatus";
import { db } from "@/server/db/client";
import { contractors, properties, tickets } from "@/server/db/schema";

export async function syncPropertyTicketCounts(propertyId: string) {
  const propertyTickets = await db.select().from(tickets).where(eq(tickets.propertyId, propertyId));
  const openTickets = propertyTickets.filter(isOpenTicket);
  const criticalTickets = openTickets.filter(isCriticalTicket).length;
  const status = criticalTickets > 0 ? "urgent" : openTickets.length > 0 ? "attention" : "healthy";

  await db
    .update(properties)
    .set({
      openTickets: openTickets.length,
      criticalTickets,
      status,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, propertyId));
}

export async function syncContractorJobCounts(contractorId: string | null | undefined) {
  if (!contractorId) return;

  const contractorTickets = await db.select().from(tickets).where(eq(tickets.contractorId, contractorId));
  await db
    .update(contractors)
    .set({
      activeJobs: contractorTickets.filter(isOpenTicket).length,
      pastJobs: contractorTickets.filter(isResolvedTicket).length,
      updatedAt: new Date(),
    })
    .where(eq(contractors.id, contractorId));
}

export async function syncTicketDerivedCounts(ticketId: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) return;

  await Promise.all([
    syncPropertyTicketCounts(ticket.propertyId),
    syncContractorJobCounts(ticket.contractorId),
  ]);
}
