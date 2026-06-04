export type Lang = "DE" | "EN";

export type LocalizedText = Record<Lang, string>;

export type TicketStatus = "new" | "waiting" | "in_progress" | "contractor_assigned" | "resolved";

export type Urgency = "low" | "medium" | "high" | "critical";

export type Role = "pm" | "tenant" | "contractor" | "owner";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "clarification_requested";

export type DemoUserDto = {
  id: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  preferredLanguage: Lang;
  role: Role;
  initials: string;
  meta: {
    label: LocalizedText;
    initials: string;
    person: LocalizedText;
    org: LocalizedText;
    color: string;
  };
};

export type HistoryItem = {
  at: LocalizedText;
  type: "tenant" | "ai" | "manager" | "contractor" | "system";
  text: LocalizedText;
  actorName?: string | null;
};

export type TicketTenant = {
  name: string;
  apartment: LocalizedText;
  building: string;
  phone: string;
  language: Lang;
};

export type PropertyDocumentDto = {
  id: string;
  name: string;
  type: string;
  updated: string;
  url?: string | null;
};

export type TicketAttachmentDto = PropertyDocumentDto;

export type TicketScheduleDto = {
  assignmentId: string;
  contractorId: string;
  status: string;
  etaHours?: number | null;
  scheduledFor?: string | null;
  dateLabel: LocalizedText;
  timeLabel: LocalizedText;
  endTimeLabel: LocalizedText;
  weekNumber: number;
  dayIndex: number;
};

export type TicketDto = {
  id: string;
  title: LocalizedText;
  category: LocalizedText;
  categoryKey: string;
  tenant: TicketTenant;
  propertyId: string;
  status: TicketStatus;
  urgency: Urgency;
  confidence: number;
  contractorId?: string;
  contractorName?: string;
  waitingHours: number;
  createdAt: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  language: Lang;
  photos: number;
  attachments?: TicketAttachmentDto[];
  schedule?: TicketScheduleDto | null;
  history: HistoryItem[];
  suggestedActions: LocalizedText[];
};

export type ContractorAppointmentDto = TicketScheduleDto & {
  ticket: TicketDto;
};

export type PropertyUnitDto = {
  id: string;
  label: string;
  tenant: string;
  status: LocalizedText;
};

export type PropertyDto = {
  id: string;
  name: string;
  address: string;
  city: string;
  units: number;
  openTickets: number;
  criticalTickets: number;
  manager: string;
  avgResponseMin: number;
  status: "healthy" | "attention" | "urgent";
  yearBuilt: number;
  type: LocalizedText;
  aiSummary: LocalizedText;
  unitsList: PropertyUnitDto[];
  documents: PropertyDocumentDto[];
};

export type ContractorDto = {
  id: string;
  name: string;
  specialty: LocalizedText;
  specialtyKey: string;
  rating: number;
  reviews: number;
  etaHours: number;
  available: boolean;
  city: string;
  serviceArea: string[];
  priceRange: string;
  topMatch?: boolean;
  preferred?: boolean;
  phone: string;
  email: string;
  activeJobs: number;
  pastJobs: number;
  avgCompletionHours: number;
  reliability: number;
  aiReason: LocalizedText;
};

export type ApprovalDto = {
  id: string;
  propertyId?: string | null;
  property: string;
  title: LocalizedText;
  summary: LocalizedText;
  contractor: string;
  amount: string;
  amountNum: number;
  timeline: LocalizedText;
  recommendation: LocalizedText;
  risk: "high" | "medium" | "low";
  urgency: Urgency;
  status: ApprovalStatus;
  links: Array<{
    label: LocalizedText;
    path: string;
    params?: Record<string, string> | null;
  }>;
};

export type InvoiceDto = {
  id: string;
  date: string;
  contractor: string;
  property: string;
  amount: string;
  amountNum: number;
  status: string;
};

export type FinancialSummaryDto = {
  monthlySpend: number;
  monthlySpendLabel: string;
  ytdSpend: number;
  ytdSpendLabel: string;
  annualBudget: number;
  annualBudgetLabel: string;
  budgetUtilization: number;
  criticalCaseCost: number;
  criticalCaseCostLabel: string;
  trendMonthlyPct: number;
  trendYtdPct: number;
  trendCriticalPct: number;
  monthlySeries: Array<{
    month: string;
    amount: number;
    label: string;
  }>;
  categoryBreakdown: Array<{
    category: LocalizedText;
    amount: number;
    amountLabel: string;
    pct: number;
  }>;
};

export type AiInsightsDto = {
  automationRate: number;
  avgResolutionHours: number;
  slaBreaches: number;
  hotspot: LocalizedText;
  responseTrend: number[];
  volumeByCategory: Array<{
    label: LocalizedText;
    value: number;
  }>;
  atRisk: Array<{
    id: string;
    title: LocalizedText;
    reason: LocalizedText;
    hours: number;
    to: {
      path: string;
      params?: Record<string, string> | null;
    };
  }>;
  aiPanel: {
    autoTriage: number;
    contractorAccepted: number;
    translations: number;
    duplicates: number;
  };
  topPerformers: ContractorDto[];
  ticketCount: number;
  activeTicketCount: number;
};

export type GlobalSearchResultDto = {
  id: string;
  type: "ticket" | "property" | "contractor";
  title: string;
  subtitle: string;
  badge?: string;
  to: {
    path: string;
    params?: Record<string, string> | null;
  };
};

export type NotificationDto = {
  id: string;
  type: "critical" | "assigned" | "photos" | "approval" | "status" | "missing" | "ai";
  title: LocalizedText;
  desc: LocalizedText;
  ticketId?: string | null;
  context?: string | null;
  time: LocalizedText;
  unread: boolean;
  to: {
    path: string;
    params?: Record<string, string> | null;
  };
  action: LocalizedText;
};

export type AiActivityDto = {
  id: string;
  at: LocalizedText;
  text: LocalizedText;
};

export type AiSuggestionStatus = "generated" | "fallback" | "failed";

export type AiStructuredIntakeDto = {
  kind: "structure_intake";
  model: string;
  status: AiSuggestionStatus;
  title: string;
  category: string;
  priority: Urgency;
  tenant: string;
  propertyId: string;
  unit: string;
  phone: string;
  email: string;
  description: string;
  contractor: string;
  confidence: number;
  access: string;
  preferred: string;
  missing: string[];
};

export type AiIntakeFollowUpDto = {
  kind: "intake_follow_up";
  model: string;
  status: AiSuggestionStatus;
  question: string;
  chips: string[];
  ready: boolean;
  confidence: number;
};

export type AiUrgencyDto = {
  kind: "classify_urgency";
  model: string;
  status: AiSuggestionStatus;
  priority: Urgency;
  confidence: number;
  reasons: string[];
};

export type AiSummaryDto = {
  kind: "summary";
  model: string;
  status: AiSuggestionStatus;
  summary: string;
  confidence: number;
};

export type AiContractorSuggestionDto = {
  kind: "contractor_suggestion";
  model: string;
  status: AiSuggestionStatus;
  contractor: string;
  contractorId?: string;
  confidence: number;
  reason: string;
};

export type AiReplyDraftDto = {
  kind: "reply_draft";
  model: string;
  status: AiSuggestionStatus;
  text: string;
  confidence: number;
};

export type AiMissingInfoDto = {
  kind: "missing_info";
  model: string;
  status: AiSuggestionStatus;
  text: string;
  items: string[];
  confidence: number;
};

export type AiTranslationDto = {
  kind: "translation";
  model: string;
  status: AiSuggestionStatus;
  text: string;
  to: Lang;
  confidence: number;
};

export type DashboardDto = {
  kpis: {
    openTickets: number;
    avgResponseMin: number;
    aiResolved: number;
    urgent: number;
    pendingContractor: number;
  };
  activeTickets: TicketDto[];
  aiActivity: AiActivityDto[];
  notifications: NotificationDto[];
};

export type DemoDataTable =
  | "organizations"
  | "users"
  | "userRoles"
  | "properties"
  | "units"
  | "tenants"
  | "contractors"
  | "tickets"
  | "ticketEvents"
  | "ticketAssignments"
  | "documents"
  | "notifications"
  | "aiActivities"
  | "aiSuggestions"
  | "approvals"
  | "invoices";

export type DemoDataStatusDto = {
  enabled: boolean;
  reason?: string;
  counts: Record<DemoDataTable, number>;
  mutableTotal: number;
  identityTotal: number;
  checkedAt: string;
};

export type DemoDataOperationDto = {
  ok: true;
  action: "clear" | "reload";
  before: DemoDataStatusDto;
  after: DemoDataStatusDto;
};
