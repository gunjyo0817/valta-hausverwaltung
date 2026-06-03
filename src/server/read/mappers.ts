import type {
  AiActivityDto,
  ApprovalDto,
  ContractorDto,
  ContractorAppointmentDto,
  DashboardDto,
  HistoryItem,
  InvoiceDto,
  LocalizedText,
  NotificationDto,
  PropertyDocumentDto,
  PropertyDto,
  PropertyUnitDto,
  TicketScheduleDto,
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
  ticketAssignments,
  tickets,
  units,
} from "@/server/db/schema";

type TicketRow = typeof tickets.$inferSelect;
type TicketEventRow = typeof ticketEvents.$inferSelect;
type TicketAssignmentRow = typeof ticketAssignments.$inferSelect;
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

function weekNumber(date: Date) {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil((((value.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function timeLabel(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(date);
}

function dateLabel(date: Date): LocalizedText {
  return {
    DE: new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }).format(date),
    EN: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Europe/Berlin" }).format(date),
  };
}

export function mapTicketSchedule(assignment: TicketAssignmentRow): TicketScheduleDto {
  const scheduled = assignment.scheduledFor;
  const end = scheduled ? new Date(scheduled.getTime() + 90 * 60 * 1000) : null;
  return {
    assignmentId: assignment.id,
    contractorId: assignment.contractorId,
    status: assignment.status,
    etaHours: assignment.etaHours,
    scheduledFor: scheduled?.toISOString() ?? null,
    dateLabel: scheduled ? dateLabel(scheduled) : { DE: "Nicht geplant", EN: "Unscheduled" },
    timeLabel: scheduled ? { DE: timeLabel(scheduled), EN: timeLabel(scheduled) } : { DE: "—", EN: "—" },
    endTimeLabel: end ? { DE: timeLabel(end), EN: timeLabel(end) } : { DE: "—", EN: "—" },
    weekNumber: scheduled ? weekNumber(scheduled) : 0,
    dayIndex: scheduled ? (scheduled.getDay() + 6) % 7 : -1,
  };
}

export function mapTicket(ticket: TicketRow, events: TicketEventRow[] = [], attachments: DocumentRow[] = [], assignment?: TicketAssignmentRow): TicketDto {
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
    schedule: assignment ? mapTicketSchedule(assignment) : null,
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

export function mapContractorAppointment(ticket: TicketDto): ContractorAppointmentDto | null {
  if (!ticket.schedule) return null;
  return {
    ...ticket.schedule,
    ticket,
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
    links: [
      ...(approval.propertyId
        ? [
            {
              label: { DE: "Objekt ansehen", EN: "View property" },
              path: "/properties/$id",
              params: { id: approval.propertyId },
            },
          ]
        : []),
      {
        label: { DE: "Finanzen ansehen", EN: "View financials" },
        path: "/owner/financials",
        params: null,
      },
    ],
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
  avgResponseMin?: number;
}): DashboardDto {
  const activeTickets = input.tickets.filter((ticket) => ticket.status !== "resolved");
  const ticketsWithContractor = input.tickets.filter((ticket) => ticket.contractorId);

  return {
    kpis: {
      openTickets: activeTickets.length,
      avgResponseMin: input.avgResponseMin ?? 0,
      aiResolved: input.tickets.filter((ticket) => ticket.confidence >= 80).length + input.aiActivity.length,
      urgent: activeTickets.filter((ticket) => ticket.urgency === "critical" || ticket.urgency === "high").length,
      pendingContractor: activeTickets.length - ticketsWithContractor.filter((ticket) => ticket.status !== "resolved").length,
    },
    activeTickets,
    aiActivity: input.aiActivity,
    notifications: input.notifications,
  };
}
