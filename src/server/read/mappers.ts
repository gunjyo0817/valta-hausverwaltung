import type {
  AiActivityDto,
  ApprovalDto,
  ContractorDto,
  DashboardDto,
  HistoryItem,
  InvoiceDto,
  LocalizedText,
  NotificationDto,
  PropertyDocumentDto,
  PropertyDto,
  PropertyUnitDto,
  TicketDto,
  TicketTenant,
} from "@/lib/api/types";
import type {
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

type TicketRow = typeof tickets.$inferSelect;
type TicketEventRow = typeof ticketEvents.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type UnitRow = typeof units.$inferSelect;
type DocumentRow = typeof documents.$inferSelect;
type ContractorRow = typeof contractors.$inferSelect;
type NotificationRow = typeof notifications.$inferSelect;
type AiActivityRow = typeof aiActivities.$inferSelect;
type ApprovalRow = typeof approvals.$inferSelect;
type InvoiceRow = typeof invoices.$inferSelect;

function localized(value: LocalizedText | null | undefined, fallback = ""): LocalizedText {
  return value ?? { DE: fallback, EN: fallback };
}

function ticketTenant(ticket: TicketRow): TicketTenant {
  const snapshot = ticket.tenantSnapshot as Partial<TicketTenant>;
  return {
    name: snapshot.name ?? "Unknown tenant",
    apartment: localized(snapshot.apartment, ""),
    building: snapshot.building ?? "",
    phone: snapshot.phone ?? "",
    language: snapshot.language === "EN" ? "EN" : "DE",
  };
}

function mapDocument(document: DocumentRow): PropertyDocumentDto {
  return {
    id: document.id,
    name: document.name,
    type: document.type,
    updated: document.updatedLabel,
    url: document.url,
  };
}

export function mapTicket(ticket: TicketRow, events: TicketEventRow[] = [], attachments: DocumentRow[] = []): TicketDto {
  return {
    id: ticket.id,
    title: ticket.title,
    category: ticket.category,
    categoryKey: ticket.categoryKey,
    tenant: ticketTenant(ticket),
    propertyId: ticket.propertyId,
    status: ticket.status,
    urgency: ticket.urgency,
    confidence: ticket.confidence,
    contractorId: ticket.contractorId ?? undefined,
    contractorName: ticket.contractorName ?? undefined,
    waitingHours: ticket.waitingHours,
    createdAt: ticket.createdAtLabel,
    summary: ticket.summary,
    description: ticket.description,
    language: ticket.language === "EN" ? "EN" : "DE",
    photos: Math.max(ticket.photos, attachments.length),
    attachments: attachments.map(mapDocument),
    history: events
      .sort((a, b) => a.sequence - b.sequence)
      .map(
        (event): HistoryItem => ({
          at: event.atLabel,
          type: event.type,
          text: event.text,
          actorName: event.actorName,
        }),
      ),
    suggestedActions: ticket.suggestedActions,
  };
}

export function mapProperty(
  property: PropertyRow,
  propertyUnits: UnitRow[] = [],
  propertyDocuments: DocumentRow[] = [],
): PropertyDto {
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    city: property.city,
    units: property.units,
    openTickets: property.openTickets,
    criticalTickets: property.criticalTickets,
    manager: property.managerName,
    avgResponseMin: property.avgResponseMin,
    status: property.status as PropertyDto["status"],
    yearBuilt: property.yearBuilt,
    type: property.type,
    aiSummary: property.aiSummary,
    unitsList: propertyUnits.map(
      (unit): PropertyUnitDto => ({
        id: unit.id,
        label: unit.label,
        tenant: unit.tenantName,
        status: unit.status,
      }),
    ),
    documents: propertyDocuments.map(mapDocument),
  };
}

export function mapContractor(contractor: ContractorRow): ContractorDto {
  return {
    id: contractor.id,
    name: contractor.name,
    specialty: contractor.specialty,
    specialtyKey: contractor.specialtyKey,
    rating: Number(contractor.rating),
    reviews: contractor.reviews,
    etaHours: contractor.etaHours,
    available: contractor.available,
    city: contractor.city,
    serviceArea: contractor.serviceArea,
    priceRange: contractor.priceRange,
    topMatch: contractor.topMatch,
    preferred: contractor.preferred,
    phone: contractor.phone,
    email: contractor.email,
    activeJobs: contractor.activeJobs,
    pastJobs: contractor.pastJobs,
    avgCompletionHours: contractor.avgCompletionHours,
    reliability: contractor.reliability,
    aiReason: contractor.aiReason,
  };
}

export function mapApproval(approval: ApprovalRow, propertyName?: string): ApprovalDto {
  return {
    id: approval.id,
    propertyId: approval.propertyId,
    property: propertyName ?? approval.propertyId ?? "",
    title: approval.title,
    summary: approval.summary,
    contractor: approval.contractorName,
    amount: approval.amountLabel,
    amountNum: approval.amountCents / 100,
    timeline: approval.timeline,
    recommendation: approval.recommendation,
    risk: approval.risk === "high" || approval.risk === "medium" || approval.risk === "low" ? approval.risk : "medium",
    urgency: approval.urgency,
    status: approval.status,
  };
}

export function mapInvoice(invoice: InvoiceRow): InvoiceDto {
  return {
    id: invoice.id,
    date: invoice.dateLabel,
    contractor: invoice.contractorName,
    property: invoice.propertyName,
    amount: invoice.amountLabel,
    amountNum: invoice.amountCents / 100,
    status: invoice.status,
  };
}

export function mapNotification(notification: NotificationRow): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    desc: notification.description,
    ticketId: notification.ticketId,
    context: notification.context,
    time: notification.timeLabel,
    unread: notification.unread,
    to: {
      path: notification.targetPath,
      params: notification.targetParams,
    },
    action: notification.action,
  };
}

export function mapAiActivity(activity: AiActivityRow): AiActivityDto {
  return {
    id: activity.id,
    at: activity.atLabel,
    text: activity.text,
  };
}

export function mapDashboard(input: {
  tickets: TicketDto[];
  aiActivity: AiActivityDto[];
  notifications: NotificationDto[];
}): DashboardDto {
  const activeTickets = input.tickets.filter((ticket) => ticket.status !== "resolved");
  return {
    kpis: {
      openTickets: 27,
      avgResponseMin: 12,
      aiResolved: 41,
      urgent: 4,
      pendingContractor: 6,
    },
    activeTickets,
    aiActivity: input.aiActivity,
    notifications: input.notifications,
  };
}
