import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type LocalizedText = {
  DE: string;
  EN: string;
};

export const userRoleEnum = pgEnum("user_role", ["pm", "tenant", "contractor", "owner"]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "new",
  "waiting",
  "in_progress",
  "contractor_assigned",
  "resolved",
]);
export const urgencyEnum = pgEnum("urgency", ["low", "medium", "high", "critical"]);
export const ticketEventTypeEnum = pgEnum("ticket_event_type", [
  "tenant",
  "ai",
  "manager",
  "contractor",
  "system",
]);
export const assignmentStatusEnum = pgEnum("assignment_status", [
  "suggested",
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "critical",
  "assigned",
  "photos",
  "approval",
  "status",
  "missing",
  "ai",
]);
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "clarification_requested",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("property_management"),
  ...timestamps,
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  displayName: text("display_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  preferredLanguage: text("preferred_language").notNull().default("DE"),
  initials: text("initials").notNull(),
  demoRole: userRoleEnum("demo_role").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: userRoleEnum("role").notNull(),
    ...timestamps,
  },
  (table) => ({
    userRoleUnique: uniqueIndex("user_roles_user_id_role_idx").on(table.userId, table.role),
  }),
);

export const properties = pgTable("properties", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  units: integer("units").notNull(),
  openTickets: integer("open_tickets").notNull().default(0),
  criticalTickets: integer("critical_tickets").notNull().default(0),
  managerName: text("manager_name").notNull(),
  avgResponseMin: integer("avg_response_min").notNull().default(0),
  status: text("status").notNull(),
  yearBuilt: integer("year_built").notNull(),
  type: jsonb("type").$type<LocalizedText>().notNull(),
  aiSummary: jsonb("ai_summary").$type<LocalizedText>().notNull(),
  ...timestamps,
});

export const units = pgTable("units", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label").notNull(),
  labelLocalized: jsonb("label_localized").$type<LocalizedText>(),
  tenantName: text("tenant_name").notNull(),
  status: jsonb("status").$type<LocalizedText>().notNull(),
  ...timestamps,
});

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  propertyId: text("property_id").references(() => properties.id),
  unitId: text("unit_id").references(() => units.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  preferredLanguage: text("preferred_language").notNull().default("DE"),
  apartment: jsonb("apartment").$type<LocalizedText>(),
  building: text("building"),
  ...timestamps,
});

export const contractors = pgTable("contractors", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  specialty: jsonb("specialty").$type<LocalizedText>().notNull(),
  specialtyKey: text("specialty_key").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  reviews: integer("reviews").notNull().default(0),
  etaHours: integer("eta_hours").notNull().default(0),
  available: boolean("available").notNull().default(true),
  city: text("city").notNull(),
  serviceArea: jsonb("service_area").$type<string[]>().notNull().default([]),
  priceRange: text("price_range").notNull(),
  topMatch: boolean("top_match").notNull().default(false),
  preferred: boolean("preferred").notNull().default(false),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  activeJobs: integer("active_jobs").notNull().default(0),
  pastJobs: integer("past_jobs").notNull().default(0),
  avgCompletionHours: integer("avg_completion_hours").notNull().default(0),
  reliability: integer("reliability").notNull().default(0),
  aiReason: jsonb("ai_reason").$type<LocalizedText>().notNull(),
  ...timestamps,
});

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  propertyId: text("property_id")
    .references(() => properties.id)
    .notNull(),
  tenantId: text("tenant_id").references(() => tenants.id),
  contractorId: text("contractor_id").references(() => contractors.id),
  title: jsonb("title").$type<LocalizedText>().notNull(),
  category: jsonb("category").$type<LocalizedText>().notNull(),
  categoryKey: text("category_key").notNull(),
  tenantSnapshot: jsonb("tenant_snapshot").$type<Record<string, unknown>>().notNull(),
  status: ticketStatusEnum("status").notNull(),
  urgency: urgencyEnum("urgency").notNull(),
  confidence: integer("confidence").notNull().default(0),
  contractorName: text("contractor_name"),
  waitingHours: integer("waiting_hours").notNull().default(0),
  createdAtLabel: jsonb("created_at_label").$type<LocalizedText>().notNull(),
  summary: jsonb("summary").$type<LocalizedText>().notNull(),
  description: jsonb("description").$type<LocalizedText>().notNull(),
  language: text("language").notNull().default("DE"),
  photos: integer("photos").notNull().default(0),
  suggestedActions: jsonb("suggested_actions").$type<LocalizedText[]>().notNull().default([]),
  ...timestamps,
});

export const ticketEvents = pgTable("ticket_events", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .references(() => tickets.id, { onDelete: "cascade" })
    .notNull(),
  type: ticketEventTypeEnum("type").notNull(),
  actorName: text("actor_name"),
  atLabel: jsonb("at_label").$type<LocalizedText>().notNull(),
  text: jsonb("text").$type<LocalizedText>().notNull(),
  sequence: integer("sequence").notNull(),
  ...timestamps,
});

export const ticketAssignments = pgTable("ticket_assignments", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .references(() => tickets.id, { onDelete: "cascade" })
    .notNull(),
  contractorId: text("contractor_id")
    .references(() => contractors.id)
    .notNull(),
  status: assignmentStatusEnum("status").notNull().default("assigned"),
  etaHours: integer("eta_hours"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  assignedByUserId: text("assigned_by_user_id").references(() => users.id),
  ...timestamps,
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  propertyId: text("property_id").references(() => properties.id, { onDelete: "cascade" }),
  ticketId: text("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  updatedLabel: text("updated_label").notNull(),
  url: text("url"),
  ...timestamps,
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  recipientUserId: text("recipient_user_id").references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: jsonb("title").$type<LocalizedText>().notNull(),
  description: jsonb("description").$type<LocalizedText>().notNull(),
  ticketId: text("ticket_id"),
  context: text("context"),
  timeLabel: jsonb("time_label").$type<LocalizedText>().notNull(),
  unread: boolean("unread").notNull().default(true),
  targetPath: text("target_path").notNull(),
  targetParams: jsonb("target_params").$type<Record<string, string>>(),
  action: jsonb("action").$type<LocalizedText>().notNull(),
  ...timestamps,
});

export const aiActivities = pgTable("ai_activities", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  atLabel: jsonb("at_label").$type<LocalizedText>().notNull(),
  text: jsonb("text").$type<LocalizedText>().notNull(),
  sequence: integer("sequence").notNull(),
  ...timestamps,
});

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  propertyId: text("property_id").references(() => properties.id),
  title: jsonb("title").$type<LocalizedText>().notNull(),
  summary: jsonb("summary").$type<LocalizedText>().notNull(),
  contractorName: text("contractor_name").notNull(),
  amountLabel: text("amount_label").notNull(),
  amountCents: integer("amount_cents").notNull(),
  timeline: jsonb("timeline").$type<LocalizedText>().notNull(),
  recommendation: jsonb("recommendation").$type<LocalizedText>().notNull(),
  risk: text("risk").notNull(),
  urgency: urgencyEnum("urgency").notNull(),
  status: approvalStatusEnum("status").notNull().default("pending"),
  ...timestamps,
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .references(() => organizations.id)
    .notNull(),
  propertyId: text("property_id").references(() => properties.id),
  contractorName: text("contractor_name").notNull(),
  propertyName: text("property_name").notNull(),
  dateLabel: text("date_label").notNull(),
  amountLabel: text("amount_label").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  ...timestamps,
});
