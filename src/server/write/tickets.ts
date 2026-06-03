import { desc, eq } from "drizzle-orm";

import type { LocalizedText, Role, Urgency } from "@/lib/api/types";
import { db } from "@/server/db/client";
import {
  contractors,
  documents,
  notifications,
  properties,
  tenants,
  ticketEvents,
  tickets,
} from "@/server/db/schema";
import { selectedDemoIdentity } from "@/server/auth/demo";
import { getTicketById } from "@/server/read/queries";
import { syncContractorJobCounts, syncPropertyTicketCounts } from "@/server/write/consistency";
import { requireDemoWriteRole } from "@/server/write/authz";

const ORG_ID = "org-hausverwaltung-berlin";
const PM_USER_ID = "demo-pm";

export type CreateTicketInput = {
  title?: string;
  category?: string;
  priority: Urgency;
  tenant: string;
  propertyId: string;
  unit?: string;
  phone?: string;
  email?: string;
  description: string;
  contractor?: string;
  confidence?: number;
  access?: string;
  preferred?: string;
  photos?: number;
  attachments?: Array<{
    name: string;
    type: string;
    url?: string | null;
  }>;
  language?: "DE" | "EN";
  role?: Role;
};

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function bi(de: string, en = de): LocalizedText {
  return { DE: de, EN: en };
}

function categoryKey(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("heiz") || normalized.includes("heat")) return "Heating";
  if (normalized.includes("sanit") || normalized.includes("plumb") || normalized.includes("wasser")) return "Water leak";
  if (normalized.includes("elektr") || normalized.includes("electric")) return "Electrical";
  if (normalized.includes("aufzug") || normalized.includes("elevator")) return "Elevator";
  if (normalized.includes("schimmel") || normalized.includes("mould") || normalized.includes("mold")) return "Mold";
  if (normalized.includes("internet")) return "Internet";
  if (normalized.includes("licht") || normalized.includes("light")) return "Lighting";
  return "Other";
}

function localizedCategory(category: string, language: "DE" | "EN"): LocalizedText {
  const map: Record<string, LocalizedText> = {
    Heating: bi("Heizung", "Heating"),
    "Water leak": bi("Wasserschaden", "Water leak"),
    Electrical: bi("Elektrik", "Electrical"),
    Elevator: bi("Aufzug", "Elevator"),
    Mold: bi("Schimmel", "Mould"),
    Internet: bi("Internet", "Internet"),
    Lighting: bi("Beleuchtung", "Lighting"),
    Other: bi("Sonstiges", "Other"),
  };
  const key = categoryKey(category);
  return map[key] ?? (language === "EN" ? bi(category, category) : bi(category, category));
}

function makeTitle(input: CreateTicketInput) {
  if (input.title?.trim()) {
    const title = input.title.trim();
    return input.language === "EN" ? bi(title, title) : bi(title, title);
  }

  const category = input.category?.trim() || "Ticket";
  if (input.description.trim()) {
    const short = input.description.trim().replace(/\s+/g, " ").slice(0, 48);
    return input.language === "EN" ? bi(short, short) : bi(short, short);
  }
  return bi(category, category);
}

function assertAttachments(input: CreateTicketInput) {
  const attachments = input.attachments ?? [];
  if (attachments.length > 5) {
    throw new Error("A ticket can include at most 5 demo attachments.");
  }

  for (const attachment of attachments) {
    const type = attachment.type || "image";
    if (!type.startsWith("image/") && type !== "image") {
      throw new Error(`Unsupported ticket attachment type: ${type}`);
    }
    if (attachment.url && !attachment.url.startsWith("data:") && !attachment.url.startsWith("http://") && !attachment.url.startsWith("https://")) {
      throw new Error("Unsupported ticket attachment URL.");
    }
    if (attachment.url && attachment.url.length > 14_000_000) {
      throw new Error("Ticket attachment is too large for demo storage.");
    }
  }
}

async function nextTicketId() {
  const rows = await db.select({ id: tickets.id }).from(tickets).orderBy(desc(tickets.id));
  const max = rows.reduce((highest, row) => {
    const match = /^VLT-(\d+)$/.exec(row.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 2049);

  return `VLT-${max + 1}`;
}

export async function createTicket(input: CreateTicketInput) {
  const role = requireDemoWriteRole("create ticket", input.role, ["pm", "tenant"]);
  const identity = selectedDemoIdentity({ role });
  assertAttachments(input);

  const ticketId = await nextTicketId();
  const language = input.language ?? "DE";
  const category = input.category?.trim() || (language === "EN" ? "Other" : "Sonstiges");
  const key = categoryKey(category);
  const attachmentCount = Math.max(input.photos ?? 0, input.attachments?.length ?? 0);
  const propertyId = role === "tenant" ? identity.propertyIds?.[0] ?? input.propertyId : input.propertyId;
  const tenantName = role === "tenant" ? identity.tenantName ?? input.tenant : input.tenant;
  const tenantId = role === "tenant" ? identity.tenantId ?? `tenant-${slug(tenantName)}-${propertyId}` : `tenant-${slug(tenantName)}-${propertyId}`;

  const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  if (!property) {
    throw new Error(`Property not found: ${propertyId}`);
  }

  const [contractor] = input.contractor
    ? await db.select().from(contractors).where(eq(contractors.name, input.contractor)).limit(1)
    : [];

  const apartment = bi(input.unit?.trim() || "—", input.unit?.trim() || "—");
  const tenantSnapshot = {
    name: tenantName,
    apartment,
    building: property.name,
    phone: input.phone ?? "",
    language,
  };

  await db
    .insert(tenants)
    .values({
      id: tenantId,
      userId: role === "tenant" ? identity.userId : tenantName === "Anna Becker" ? "demo-tenant" : null,
      propertyId,
      unitId: null,
      name: tenantName,
      phone: input.phone ?? null,
      email: input.email ?? null,
      preferredLanguage: language,
      apartment,
      building: property.name,
    })
    .onConflictDoUpdate({
      target: tenants.id,
      set: {
        phone: input.phone ?? null,
        email: input.email ?? null,
        apartment,
        building: property.name,
      },
    });

  await db.insert(tickets).values({
    id: ticketId,
    organizationId: ORG_ID,
    propertyId,
    tenantId,
    contractorId: contractor?.id ?? null,
    title: makeTitle(input),
    category: localizedCategory(category, language),
    categoryKey: key,
    tenantSnapshot,
    status: "new",
    urgency: input.priority,
    confidence: input.confidence ?? 0,
    contractorName: contractor?.name ?? input.contractor ?? null,
    waitingHours: 0,
    createdAtLabel: bi("jetzt", "now"),
    summary: bi(input.description, input.description),
    description: bi(input.description, input.description),
    language,
    photos: attachmentCount,
    suggestedActions: contractor?.name
      ? [bi(`Handwerker ${contractor.name} beauftragen`, `Dispatch contractor ${contractor.name}`)]
      : [],
  });

  const attachmentRows =
    input.attachments && input.attachments.length > 0
      ? input.attachments
      : Array.from({ length: input.photos ?? 0 }).map((_, index) => ({
          name: `Foto ${index + 1}`,
          type: "image",
          url: null,
        }));

  if (attachmentRows.length > 0) {
    await db.insert(documents).values(
      attachmentRows.map((attachment, index) => ({
        id: `${ticketId}-attachment-${index + 1}`,
        propertyId: null,
        ticketId,
        name: attachment.name,
        type: attachment.type,
        updatedLabel: language === "EN" ? "now" : "jetzt",
        url: attachment.url ?? null,
      })),
    );
  }

  await db.insert(ticketEvents).values({
    id: `${ticketId}-event-1`,
    ticketId,
    type: input.confidence ? "ai" : "manager",
    actorName: input.confidence ? "Valta AI" : "Sarah Krüger",
    atLabel: bi("jetzt", "now"),
    text: input.confidence
      ? bi(
          `Ticket aus unstrukturierter Anfrage erstellt. Kategorie: ${category}. Priorität: ${input.priority}.`,
          `Ticket created from unstructured request. Category: ${category}. Priority: ${input.priority}.`,
        )
      : bi("Manuelles Ticket erstellt.", "Manual ticket created."),
    sequence: 1,
  });

  if (input.access || input.preferred) {
    await db.insert(ticketEvents).values({
      id: `${ticketId}-event-2`,
      ticketId,
      type: "manager",
      actorName: "Sarah Krüger",
      atLabel: bi("jetzt", "now"),
      text: bi(
        [input.access && `Zugang: ${input.access}`, input.preferred && `Wunschtermin: ${input.preferred}`]
          .filter(Boolean)
          .join(" · "),
        [input.access && `Access: ${input.access}`, input.preferred && `Preferred time: ${input.preferred}`]
          .filter(Boolean)
          .join(" · "),
      ),
      sequence: 2,
    });
  }

  const created = await getTicketById(ticketId, { role });
  if (!created) throw new Error(`Created ticket not found: ${ticketId}`);

  await Promise.all([
    syncPropertyTicketCounts(propertyId),
    syncContractorJobCounts(contractor?.id),
  ]);

  await db
    .insert(notifications)
    .values({
      id: `${ticketId}-created-pm`,
      recipientUserId: PM_USER_ID,
      type: input.priority === "critical" ? "critical" : "status",
      title: input.priority === "critical"
        ? bi("Neuer kritischer Fall", "New critical case")
        : bi("Neues Ticket erstellt", "New ticket created"),
      description: bi(`${ticketId} · ${created.title.DE}`, `${ticketId} · ${created.title.EN}`),
      ticketId,
      context: property.name,
      timeLabel: bi("jetzt", "now"),
      unread: true,
      targetPath: "/ticket/$id",
      targetParams: { id: ticketId },
      action: bi("Ticket öffnen", "Open ticket"),
    })
    .onConflictDoNothing();

  return created;
}

export { PM_USER_ID };
