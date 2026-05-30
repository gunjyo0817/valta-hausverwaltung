import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { selectedDemoIdentity, type DemoRoleContext } from "@/server/auth/demo";
import {
  aiActivities,
  approvals,
  contractors,
  documents,
  invoices,
  notifications,
  properties,
  ticketEvents,
  tickets,
  units,
} from "@/server/db/schema";

import {
  mapAiActivity,
  mapApproval,
  mapContractor,
  mapDashboard,
  mapInvoice,
  mapNotification,
  mapProperty,
  mapTicket,
} from "./mappers";

function groupBy<T, K extends string>(items: T[], key: (item: T) => K) {
  return items.reduce(
    (acc, item) => {
      const groupKey = key(item);
      acc[groupKey] ??= [];
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export async function listTickets(context?: DemoRoleContext) {
  const [ticketRows, eventRows, documentRows] = await Promise.all([
    db.select().from(tickets).orderBy(desc(tickets.id)),
    db.select().from(ticketEvents).orderBy(asc(ticketEvents.sequence)),
    db.select().from(documents).orderBy(asc(documents.id)),
  ]);
  const eventsByTicket = groupBy(eventRows, (event) => event.ticketId);
  const attachmentsByTicket = groupBy(
    documentRows.filter((document) => document.ticketId),
    (document) => document.ticketId!,
  );
  const identity = selectedDemoIdentity(context);
  const scopedRows = ticketRows.filter((ticket) => {
    if (identity.role === "tenant") {
      return ticket.tenantId === identity.tenantId || (ticket.tenantSnapshot as { name?: string }).name === identity.tenantName;
    }
    if (identity.role === "contractor") {
      return ticket.contractorId === identity.contractorId;
    }
    return true;
  });

  return scopedRows.map((ticket) => mapTicket(ticket, eventsByTicket[ticket.id] ?? [], attachmentsByTicket[ticket.id] ?? []));
}

export async function getTicketById(id: string, context?: DemoRoleContext) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!ticket) return null;

  const identity = selectedDemoIdentity(context);
  if (identity.role === "tenant") {
    const tenantName = (ticket.tenantSnapshot as { name?: string }).name;
    if (ticket.tenantId !== identity.tenantId && tenantName !== identity.tenantName) return null;
  }
  if (identity.role === "contractor" && ticket.contractorId !== identity.contractorId) return null;

  const [events, attachments] = await Promise.all([
    db
      .select()
      .from(ticketEvents)
      .where(eq(ticketEvents.ticketId, id))
      .orderBy(asc(ticketEvents.sequence)),
    db
      .select()
      .from(documents)
      .where(eq(documents.ticketId, id))
      .orderBy(asc(documents.id)),
  ]);

  return mapTicket(ticket, events, attachments);
}

export async function listProperties(context?: DemoRoleContext) {
  const [propertyRows, unitRows, documentRows] = await Promise.all([
    db.select().from(properties).orderBy(asc(properties.name)),
    db.select().from(units).orderBy(asc(units.id)),
    db.select().from(documents).orderBy(asc(documents.id)),
  ]);

  const unitsByProperty = groupBy(unitRows, (unit) => unit.propertyId);
  const documentsByProperty = groupBy(
    documentRows.filter((document) => document.propertyId),
    (document) => document.propertyId!,
  );

  const identity = selectedDemoIdentity(context);
  const scopedProperties =
    identity.role === "tenant" && identity.propertyIds
      ? propertyRows.filter((property) => identity.propertyIds!.includes(property.id))
      : identity.role === "contractor" && identity.propertyIds
        ? propertyRows.filter((property) => identity.propertyIds!.includes(property.id))
        : propertyRows;

  return scopedProperties.map((property) =>
    mapProperty(property, unitsByProperty[property.id] ?? [], documentsByProperty[property.id] ?? []),
  );
}

export async function getPropertyById(id: string, context?: DemoRoleContext) {
  const identity = selectedDemoIdentity(context);
  if ((identity.role === "tenant" || identity.role === "contractor") && !identity.propertyIds?.includes(id)) {
    return null;
  }

  const [property] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (!property) return null;

  const [propertyUnits, propertyDocuments] = await Promise.all([
    db.select().from(units).where(eq(units.propertyId, id)).orderBy(asc(units.id)),
    db.select().from(documents).where(eq(documents.propertyId, id)).orderBy(asc(documents.id)),
  ]);

  return mapProperty(property, propertyUnits, propertyDocuments);
}

export async function listContractors(context?: DemoRoleContext) {
  const contractorRows = await db.select().from(contractors).orderBy(asc(contractors.name));
  const identity = selectedDemoIdentity(context);
  const scopedRows =
    identity.role === "contractor"
      ? contractorRows.filter((contractor) => contractor.id === identity.contractorId)
      : contractorRows;

  return scopedRows.map(mapContractor);
}

export async function getContractorById(id: string, context?: DemoRoleContext) {
  const identity = selectedDemoIdentity(context);
  if (identity.role === "contractor" && id !== identity.contractorId) return null;

  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  return contractor ? mapContractor(contractor) : null;
}

export async function listNotifications(context?: DemoRoleContext) {
  const identity = selectedDemoIdentity(context);
  const notificationRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientUserId, identity.userId))
    .orderBy(desc(notifications.createdAt));
  return notificationRows.map(mapNotification);
}

export async function listApprovals(_context?: DemoRoleContext) {
  const [approvalRows, propertyRows] = await Promise.all([
    db.select().from(approvals).orderBy(desc(approvals.updatedAt), desc(approvals.id)),
    db.select({ id: properties.id, name: properties.name }).from(properties),
  ]);

  const propertyNames = new Map(propertyRows.map((property) => [property.id, property.name]));
  return approvalRows.map((approval) => mapApproval(approval, propertyNames.get(approval.propertyId ?? "")));
}

export async function listInvoices(_context?: DemoRoleContext) {
  const invoiceRows = await db.select().from(invoices).orderBy(desc(invoices.id));
  return invoiceRows.map(mapInvoice);
}

export async function listAiActivity() {
  const activityRows = await db.select().from(aiActivities).orderBy(asc(aiActivities.sequence));
  return activityRows.map(mapAiActivity);
}

export async function getDashboardData(context?: DemoRoleContext) {
  const [ticketDtos, activityDtos, notificationDtos] = await Promise.all([
    listTickets(context),
    listAiActivity(),
    listNotifications(context),
  ]);

  return mapDashboard({
    tickets: ticketDtos,
    aiActivity: activityDtos,
    notifications: notificationDtos,
  });
}
