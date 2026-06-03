import { eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { contractors, properties, tickets } from "@/server/db/schema";

export async function syncPropertyTicketCounts(propertyId: string) {
  const propertyTickets = await db.select().from(tickets).where(eq(tickets.propertyId, propertyId));
  const openTickets = propertyTickets.filter((ticket) => ticket.status !== "resolved");
  const criticalTickets = openTickets.filter((ticket) => ticket.urgency === "critical").length;
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
      activeJobs: contractorTickets.filter((ticket) => ticket.status !== "resolved").length,
      pastJobs: contractorTickets.filter((ticket) => ticket.status === "resolved").length,
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
