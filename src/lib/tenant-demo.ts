import type { TicketDto } from "@/lib/api";

export function isDemoTenantTicket(ticket: Pick<TicketDto, "tenant" | "propertyId">) {
  return ticket.tenant.name === "Anna Becker" || ticket.propertyId === "p-lindenstr-22";
}
