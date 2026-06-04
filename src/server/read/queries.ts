import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { selectedDemoIdentity, type DemoRoleContext } from "@/server/auth/demo";
import {
  aiActivities,
  aiSuggestions,
  approvals,
  contractors,
  documents,
  invoices,
  notifications,
  properties,
  ticketAssignments,
  ticketEvents,
  tickets,
  units,
} from "@/server/db/schema";

import {
  mapAiActivity,
  mapApproval,
  mapContractorAppointment,
  mapContractor,
  mapDashboard,
  mapInvoice,
  mapNotification,
  mapProperty,
  mapTicket,
} from "./mappers";
import type { AiInsightsDto, FinancialSummaryDto, GlobalSearchResultDto, LocalizedText } from "@/lib/api/types";
import {
  isCriticalTicket,
  isHighOrCriticalTicket,
  isOpenTicket,
  isResolvedTicket,
} from "@/lib/ticketStatus";

const ANNUAL_OWNER_BUDGET = 60000;

export type PropertyListOptions = {
  query?: string;
  status?: string;
  city?: string;
  limit?: number;
  offset?: number;
};

export type ContractorListOptions = {
  query?: string;
  specialtyKey?: string;
  availability?: "all" | "available" | "unavailable";
  limit?: number;
  offset?: number;
};

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
  const [ticketRows, eventRows, documentRows, assignmentRows] = await Promise.all([
    db.select().from(tickets).orderBy(desc(tickets.id)),
    db.select().from(ticketEvents).orderBy(asc(ticketEvents.sequence)),
    db.select().from(documents).orderBy(asc(documents.id)),
    db.select().from(ticketAssignments).orderBy(desc(ticketAssignments.updatedAt)),
  ]);
  const eventsByTicket = groupBy(eventRows, (event) => event.ticketId);
  const assignmentsByTicket = groupBy(assignmentRows, (assignment) => assignment.ticketId);
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

  return scopedRows.map((ticket) => mapTicket(ticket, eventsByTicket[ticket.id] ?? [], attachmentsByTicket[ticket.id] ?? [], assignmentsByTicket[ticket.id]?.[0]));
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

  const [events, attachments, assignments] = await Promise.all([
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
    db
      .select()
      .from(ticketAssignments)
      .where(eq(ticketAssignments.ticketId, id))
      .orderBy(desc(ticketAssignments.updatedAt)),
  ]);

  return mapTicket(ticket, events, attachments, assignments[0]);
}

export async function listContractorSchedule(context?: DemoRoleContext) {
  const tickets = await listTickets(context);
  return tickets
    .filter((ticket) => ticket.contractorId && ticket.status !== "resolved")
    .map(mapContractorAppointment)
    .filter((appointment): appointment is NonNullable<typeof appointment> => Boolean(appointment))
    .sort((a, b) => {
      if (!a.scheduledFor && !b.scheduledFor) return a.ticket.id.localeCompare(b.ticket.id);
      if (!a.scheduledFor) return 1;
      if (!b.scheduledFor) return -1;
      return a.scheduledFor.localeCompare(b.scheduledFor);
    });
}

function paginate<T>(items: T[], limit?: number, offset?: number) {
  const start = Math.max(offset ?? 0, 0);
  const end = limit ? start + Math.min(Math.max(limit, 1), 100) : undefined;
  return items.slice(start, end);
}

export async function listProperties(context?: DemoRoleContext & PropertyListOptions) {
  const [propertyRows, unitRows, documentRows, ticketRows] = await Promise.all([
    db.select().from(properties).orderBy(asc(properties.name)),
    db.select().from(units).orderBy(asc(units.id)),
    db.select().from(documents).orderBy(asc(documents.id)),
    db.select().from(tickets),
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

  const ticketsByProperty = groupBy(ticketRows, (ticket) => ticket.propertyId);

  const mapped = scopedProperties.map((property) => {
    const propertyTickets = ticketsByProperty[property.id] ?? [];
    const openTickets = propertyTickets.filter(isOpenTicket);
    const criticalTickets = openTickets.filter(isCriticalTicket).length;
    return {
      ...mapProperty(property, unitsByProperty[property.id] ?? [], documentsByProperty[property.id] ?? []),
      openTickets: openTickets.length,
      criticalTickets,
      status: criticalTickets > 0 ? "urgent" : openTickets.length > 0 ? "attention" : "healthy",
    };
  });

  const query = context?.query?.trim() ?? "";
  const filtered = mapped.filter((property) =>
    (context?.status === undefined || context.status === "all" || property.status === context.status) &&
    (context?.city === undefined || context.city === "all" || property.city === context.city) &&
    matchesTerm([property.name, property.address, property.city, property.manager], query),
  );

  return paginate(filtered, context?.limit, context?.offset);
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

  const propertyTickets = await db.select().from(tickets).where(eq(tickets.propertyId, id));
  const openTickets = propertyTickets.filter(isOpenTicket);
  const criticalTickets = openTickets.filter(isCriticalTicket).length;

  return {
    ...mapProperty(property, propertyUnits, propertyDocuments),
    openTickets: openTickets.length,
    criticalTickets,
    status: criticalTickets > 0 ? "urgent" : openTickets.length > 0 ? "attention" : "healthy",
  };
}

export async function listContractors(context?: DemoRoleContext & ContractorListOptions) {
  const [contractorRows, ticketRows] = await Promise.all([
    db.select().from(contractors).orderBy(asc(contractors.name)),
    db.select().from(tickets),
  ]);
  const identity = selectedDemoIdentity(context);
  const scopedRows =
    identity.role === "contractor"
      ? contractorRows.filter((contractor) => contractor.id === identity.contractorId)
      : contractorRows;

  const mapped = scopedRows.map((contractor) => {
    const contractorTickets = ticketRows.filter((ticket) => ticket.contractorId === contractor.id);
    return {
      ...mapContractor(contractor),
      activeJobs: contractorTickets.filter(isOpenTicket).length,
      pastJobs: contractorTickets.filter(isResolvedTicket).length,
    };
  });

  const query = context?.query?.trim() ?? "";
  const filtered = mapped.filter((contractor) =>
    (context?.specialtyKey === undefined || context.specialtyKey === "all" || contractor.specialtyKey === context.specialtyKey) &&
    (context?.availability === undefined || context.availability === "all" || (context.availability === "available" ? contractor.available : !contractor.available)) &&
    matchesTerm([contractor.name, contractor.city, contractor.specialty.DE, contractor.specialty.EN, contractor.email], query),
  );

  return paginate(filtered, context?.limit, context?.offset);
}

export async function getContractorById(id: string, context?: DemoRoleContext) {
  const identity = selectedDemoIdentity(context);
  if (identity.role === "contractor" && id !== identity.contractorId) return null;

  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  if (!contractor) return null;
  const contractorTickets = await db.select().from(tickets).where(eq(tickets.contractorId, id));
  return {
    ...mapContractor(contractor),
    activeJobs: contractorTickets.filter(isOpenTicket).length,
    pastJobs: contractorTickets.filter(isResolvedTicket).length,
  };
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

function moneyLabel(amount: number) {
  return `€ ${Math.round(amount).toLocaleString("de-DE")}`;
}

function parseInvoiceDateLabel(dateLabel: string) {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(dateLabel.trim());
  if (!match) return null;
  const [, dayRaw, monthRaw, yearRaw] = match;
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
}

function categoryForContractor(contractorName: string): LocalizedText {
  const name = contractorName.toLocaleLowerCase("de-DE");
  if (name.includes("heiz") || name.includes("müller") || name.includes("mueller")) return { DE: "Heizung", EN: "Heating" };
  if (name.includes("sanit") || name.includes("klemp") || name.includes("schulz")) return { DE: "Sanitär", EN: "Plumbing" };
  if (name.includes("elekt")) return { DE: "Elektrik", EN: "Electrical" };
  if (name.includes("aufzug") || name.includes("schindler")) return { DE: "Aufzug", EN: "Elevator" };
  if (name.includes("dach") || name.includes("fassade") || name.includes("gutachter")) return { DE: "Dach & Fassade", EN: "Roof & facade" };
  return { DE: "Sonstiges", EN: "Other" };
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getFinancialSummary(_context?: DemoRoleContext): Promise<FinancialSummaryDto> {
  const [invoiceRows, approvalRows] = await Promise.all([
    db.select().from(invoices),
    db.select().from(approvals),
  ]);

  const ytdSpend = invoiceRows.reduce((sum, invoice) => sum + invoice.amountCents / 100, 0);
  const utilization = ANNUAL_OWNER_BUDGET > 0 ? Math.min(100, Math.round((ytdSpend / ANNUAL_OWNER_BUDGET) * 100)) : 0;

  const amountsByMonth = new Map<string, { date: Date; amount: number }>();
  for (const invoice of invoiceRows) {
    const parsed = parseInvoiceDateLabel(invoice.dateLabel);
    if (!parsed) continue;
    const key = monthKey(parsed);
    const previous = amountsByMonth.get(key);
    amountsByMonth.set(key, {
      date: previous?.date ?? parsed,
      amount: (previous?.amount ?? 0) + invoice.amountCents / 100,
    });
  }

  const monthlySeries = [...amountsByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, item]) => ({
      month: monthLabel(item.date),
      amount: item.amount,
      label: moneyLabel(item.amount),
    }));
  const latestMonthlySpend = monthlySeries.at(-1)?.amount ?? 0;
  const previousMonthlySpend = monthlySeries.at(-2)?.amount ?? 0;

  const categoryTotals = new Map<string, { category: LocalizedText; amount: number }>();
  for (const invoice of invoiceRows) {
    const category = categoryForContractor(invoice.contractorName);
    const key = category.DE;
    const previous = categoryTotals.get(key);
    categoryTotals.set(key, {
      category,
      amount: (previous?.amount ?? 0) + invoice.amountCents / 100,
    });
  }
  const categoryBreakdown = [...categoryTotals.values()]
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      category: item.category,
      amount: item.amount,
      amountLabel: moneyLabel(item.amount),
      pct: ytdSpend > 0 ? Math.round((item.amount / ytdSpend) * 100) : 0,
    }));

  const criticalCaseCost = approvalRows
    .filter((approval) => approval.status === "pending" && approval.urgency === "critical")
    .reduce((sum, approval) => sum + approval.amountCents / 100, 0);

  return {
    monthlySpend: latestMonthlySpend,
    monthlySpendLabel: moneyLabel(latestMonthlySpend),
    ytdSpend,
    ytdSpendLabel: moneyLabel(ytdSpend),
    annualBudget: ANNUAL_OWNER_BUDGET,
    annualBudgetLabel: moneyLabel(ANNUAL_OWNER_BUDGET),
    budgetUtilization: utilization,
    criticalCaseCost,
    criticalCaseCostLabel: moneyLabel(criticalCaseCost),
    trendMonthlyPct: percentChange(latestMonthlySpend, previousMonthlySpend),
    trendYtdPct: 0,
    trendCriticalPct: 0,
    monthlySeries,
    categoryBreakdown,
  };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function categoryKey(category: LocalizedText) {
  return `${category.DE}|${category.EN}`;
}

function parseCategoryKey(key: string): LocalizedText {
  const [DE, EN] = key.split("|");
  return { DE: DE ?? "", EN: EN ?? DE ?? "" };
}

function matchesTerm(values: Array<string | null | undefined>, term: string) {
  const normalized = term.trim().toLocaleLowerCase("de-DE");
  if (!normalized) return true;
  return values.some((value) => value?.toLocaleLowerCase("de-DE").includes(normalized));
}

export async function getAiInsights(_context?: DemoRoleContext): Promise<AiInsightsDto> {
  const [ticketRows, contractorRows, suggestionRows] = await Promise.all([
    db.select().from(tickets),
    db.select().from(contractors),
    db.select().from(aiSuggestions),
  ]);

  const openTickets = ticketRows.filter(isOpenTicket);
  const resolvedTickets = ticketRows.filter(isResolvedTicket);
  const automationRate = ticketRows.length === 0 ? 0 : Math.min(100, Math.round((suggestionRows.length / ticketRows.length) * 100));
  const avgResolutionHours = resolvedTickets.length > 0
    ? average(resolvedTickets.map((ticket) => Math.max(1, ticket.waitingHours)))
    : average(ticketRows.map((ticket) => Math.max(1, Math.round(ticket.waitingHours / 2))));
  const slaBreaches = openTickets.filter((ticket) => {
    const threshold = ticket.urgency === "critical" ? 4 : ticket.urgency === "high" ? 12 : 48;
    return ticket.waitingHours > threshold;
  }).length;

  const categoryCounts = new Map<string, number>();
  for (const ticket of ticketRows) {
    const key = categoryKey(ticket.category);
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
  }
  const categoryEntries = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
  const hotspot = categoryEntries[0] ? parseCategoryKey(categoryEntries[0][0]) : { DE: "—", EN: "—" };
  const volumeByCategory = categoryEntries.map(([key, count]) => ({
    label: parseCategoryKey(key),
    value: ticketRows.length === 0 ? 0 : Math.round((count / ticketRows.length) * 100),
  }));

  const responseTrend = Array.from({ length: 8 }, (_, index) => {
    const bucket = ticketRows.filter((_, ticketIndex) => ticketIndex % 8 === index);
    return average(bucket.map((ticket) => Math.max(1, ticket.waitingHours)));
  });

  const atRisk = openTickets
    .filter((ticket) => ticket.waitingHours > 8 || isHighOrCriticalTicket(ticket))
    .sort((a, b) => {
      const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency] || b.waitingHours - a.waitingHours;
    })
    .slice(0, 5)
    .map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      reason: {
        DE: `${ticket.waitingHours} Std. offen · ${ticket.category.DE}`,
        EN: `${ticket.waitingHours}h open · ${ticket.category.EN}`,
      },
      hours: ticket.waitingHours,
      to: {
        path: "/ticket/$id",
        params: { id: ticket.id },
      },
    }));

  const aiPanel = {
    autoTriage: ticketRows.length === 0 ? 0 : Math.round((ticketRows.filter((ticket) => ticket.confidence >= 80).length / ticketRows.length) * 100),
    contractorAccepted: ticketRows.length === 0 ? 0 : Math.round((ticketRows.filter((ticket) => ticket.contractorId).length / ticketRows.length) * 100),
    translations: suggestionRows.length === 0 ? 0 : Math.round((suggestionRows.filter((suggestion) => suggestion.kind === "translation").length / suggestionRows.length) * 100),
    duplicates: Math.max(0, suggestionRows.length - new Set(suggestionRows.map((suggestion) => `${suggestion.kind}:${suggestion.ticketId ?? JSON.stringify(suggestion.input)}`)).size),
  };

  const topPerformers = contractorRows
    .map(mapContractor)
    .sort((a, b) => b.reliability - a.reliability || b.rating - a.rating)
    .slice(0, 6);

  return {
    automationRate,
    avgResolutionHours,
    slaBreaches,
    hotspot,
    responseTrend,
    volumeByCategory,
    atRisk,
    aiPanel,
    topPerformers,
    ticketCount: ticketRows.length,
    activeTicketCount: openTickets.length,
  };
}

export async function searchGlobal(input: { query: string; limit?: number; role?: DemoRoleContext["role"] }): Promise<GlobalSearchResultDto[]> {
  const term = input.query.trim();
  if (term.length < 2) return [];
  const limit = Math.min(Math.max(input.limit ?? 8, 1), 20);
  const context = input.role ? { role: input.role } : undefined;
  const [ticketDtos, propertyDtos, contractorDtos] = await Promise.all([
    listTickets(context),
    listProperties(context),
    listContractors(context),
  ]);

  const ticketResults: GlobalSearchResultDto[] = ticketDtos
    .filter((ticket) => matchesTerm([
      ticket.id,
      ticket.title.DE,
      ticket.title.EN,
      ticket.summary.DE,
      ticket.summary.EN,
      ticket.tenant.name,
      ticket.tenant.building,
      ticket.tenant.apartment.DE,
      ticket.tenant.apartment.EN,
    ], term))
    .map((ticket) => ({
      id: ticket.id,
      type: "ticket",
      title: `${ticket.id} · ${ticket.title.EN}`,
      subtitle: `${ticket.tenant.name} · ${ticket.tenant.building}`,
      badge: ticket.status,
      to: { path: "/ticket/$id", params: { id: ticket.id } },
    }));

  const propertyResults: GlobalSearchResultDto[] = propertyDtos
    .filter((property) => matchesTerm([property.name, property.address, property.city, property.manager], term))
    .map((property) => ({
      id: property.id,
      type: "property",
      title: property.name,
      subtitle: `${property.address} · ${property.city}`,
      badge: property.status,
      to: { path: "/properties/$id", params: { id: property.id } },
    }));

  const contractorResults: GlobalSearchResultDto[] = contractorDtos
    .filter((contractor) => matchesTerm([contractor.name, contractor.city, contractor.specialty.DE, contractor.specialty.EN, contractor.email], term))
    .map((contractor) => ({
      id: contractor.id,
      type: "contractor",
      title: contractor.name,
      subtitle: `${contractor.specialty.EN} · ${contractor.city}`,
      badge: contractor.available ? "available" : "unavailable",
      to: { path: "/contractors/$id", params: { id: contractor.id } },
    }));

  return [...ticketResults, ...propertyResults, ...contractorResults].slice(0, limit);
}

export async function listAiActivity() {
  const activityRows = await db.select().from(aiActivities).orderBy(asc(aiActivities.sequence));
  return activityRows.map(mapAiActivity);
}

export async function getDashboardData(context?: DemoRoleContext) {
  const [ticketDtos, activityDtos, notificationDtos, propertyDtos] = await Promise.all([
    listTickets(context),
    listAiActivity(),
    listNotifications(context),
    listProperties(context),
  ]);
  const avgResponseMin =
    propertyDtos.length === 0
      ? 0
      : Math.round(propertyDtos.reduce((sum, property) => sum + property.avgResponseMin, 0) / propertyDtos.length);

  return mapDashboard({
    tickets: ticketDtos,
    aiActivity: activityDtos,
    notifications: notificationDtos,
    avgResponseMin,
  });
}
