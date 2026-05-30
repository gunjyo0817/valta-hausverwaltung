import { db } from "../src/server/db/client";
import {
  aiActivities,
  approvals,
  contractors as contractorsTable,
  documents,
  invoices,
  notifications as notificationsTable,
  organizations,
  properties as propertiesTable,
  tenants,
  ticketAssignments,
  ticketEvents,
  tickets as ticketsTable,
  units,
  userRoles,
  users,
  type LocalizedText,
} from "../src/server/db/schema";
import { allContractors } from "../src/lib/contractors";
import { aiActivity, tickets } from "../src/lib/mockData";
import { properties } from "../src/lib/properties";
import { ROLE_META, type Role } from "../src/lib/role";

const ORG_ID = "org-hausverwaltung-berlin";

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cents(amount: string) {
  const normalized = amount.replace(/[^\d,.-]/g, "").replace(".", "").replace(",", ".");
  return Math.round(Number(normalized) * 100);
}

function demoUserId(role: Role) {
  return `demo-${role}`;
}

const roleOrder: Role[] = ["pm", "tenant", "contractor", "owner"];

const fullNotifications = [
  {
    id: "n1",
    type: "critical" as const,
    title: { DE: "Neuer kritischer Fall: Heizungsausfall", EN: "New critical case: Heating failure" },
    description: {
      DE: "Komplettausfall der Zentralheizung gemeldet.",
      EN: "Complete central heating failure reported.",
    },
    ticketId: "VLT-2041",
    context: "Lindenstraße 22",
    timeLabel: { DE: "vor 4 Min.", EN: "4 min ago" },
    unread: true,
    targetPath: "/ticket/$id",
    targetParams: { id: "VLT-2041" },
    action: { DE: "Ticket öffnen", EN: "Open ticket" },
  },
  {
    id: "n2",
    type: "photos" as const,
    title: { DE: "Mieter hat 2 Fotos hochgeladen", EN: "Tenant uploaded 2 photos" },
    description: { DE: "Wasserschaden in der Küche", EN: "Water leak in kitchen" },
    ticketId: "VLT-2039",
    context: "Goethestraße 8",
    timeLabel: { DE: "vor 18 Min.", EN: "18 min ago" },
    unread: true,
    targetPath: "/ticket/$id",
    targetParams: { id: "VLT-2039" },
    action: { DE: "Fotos prüfen", EN: "Review photos" },
  },
  {
    id: "n3",
    type: "approval" as const,
    title: { DE: "Eigentümer-Freigabe erforderlich", EN: "Owner approval needed" },
    description: { DE: "Heizungsaustausch · € 12.400", EN: "Heating replacement · €12,400" },
    ticketId: "AP-104",
    context: "Lindenstraße 22",
    timeLabel: { DE: "vor 1 Std.", EN: "1 h ago" },
    unread: true,
    targetPath: "/owner/approvals",
    targetParams: null,
    action: { DE: "Freigabe prüfen", EN: "Review approval" },
  },
  {
    id: "n4",
    type: "assigned" as const,
    title: { DE: "Handwerker hat Termin bestätigt", EN: "Contractor confirmed appointment" },
    description: { DE: "Müller Heizung GmbH · Heute 14:00", EN: "Müller Heizung GmbH · Today 14:00" },
    ticketId: "VLT-2037",
    context: "Parkallee 110",
    timeLabel: { DE: "vor 2 Std.", EN: "2 h ago" },
    unread: false,
    targetPath: "/contractor/schedule",
    targetParams: null,
    action: { DE: "Plan ansehen", EN: "View schedule" },
  },
  {
    id: "n5",
    type: "status" as const,
    title: { DE: "Ticket-Status geändert", EN: "Ticket status changed" },
    description: { DE: "In Bearbeitung -> Wartet auf Mieter", EN: "In progress -> Waiting on tenant" },
    ticketId: "VLT-2030",
    context: "Rosenweg 3",
    timeLabel: { DE: "vor 3 Std.", EN: "3 h ago" },
    unread: false,
    targetPath: "/ticket/$id",
    targetParams: { id: "VLT-2030" },
    action: { DE: "Ticket öffnen", EN: "Open ticket" },
  },
  {
    id: "n6",
    type: "missing" as const,
    title: { DE: "Fehlende Informationen", EN: "Missing information" },
    description: {
      DE: "Mieter-Telefonnummer benötigt für Terminabstimmung.",
      EN: "Tenant phone number required to schedule.",
    },
    ticketId: "VLT-2025",
    context: "Lindenstraße 22",
    timeLabel: { DE: "vor 5 Std.", EN: "5 h ago" },
    unread: false,
    targetPath: "/ticket/$id",
    targetParams: { id: "VLT-2025" },
    action: { DE: "Ergänzen", EN: "Add details" },
  },
  {
    id: "n7",
    type: "ai" as const,
    title: { DE: "KI-Empfehlung verfügbar", EN: "AI suggestion ready" },
    description: {
      DE: "3 ähnliche Fälle deuten auf Ventildefekt hin.",
      EN: "3 similar cases suggest a valve defect.",
    },
    ticketId: "VLT-2039",
    context: "Goethestraße 8",
    timeLabel: { DE: "gestern", EN: "yesterday" },
    unread: false,
    targetPath: "/insights",
    targetParams: null,
    action: { DE: "Einsicht öffnen", EN: "Open insight" },
  },
];

const ownerApprovals = [
  {
    id: "AP-104",
    propertyName: "Lindenstraße 22",
    title: { DE: "Heizungsanlage – Tausch", EN: "Heating system — replacement" },
    summary: {
      DE: "Zentralheizung mit 3 Ausfällen in 30 Tagen. Ersatzteile für Modell nicht mehr verfügbar.",
      EN: "Central heating with 3 failures in 30 days. Spare parts for this model no longer available.",
    },
    contractorName: "Müller Heizung GmbH",
    amountLabel: "€ 12.400",
    timeline: { DE: "5–7 Werktage nach Freigabe", EN: "5–7 business days after approval" },
    recommendation: {
      DE: "Empfohlen: Austausch lohnt sich. Reparaturhistorie zeigt Eskalation, Angebot 8 % unter Marktdurchschnitt.",
      EN: "Recommended: replacement is cost-effective. Repair history shows escalation, quote 8% below market average.",
    },
    risk: "high",
    urgency: "critical" as const,
  },
  {
    id: "AP-103",
    propertyName: "Parkallee 110",
    title: { DE: "Dachsanierung", EN: "Roof repair" },
    summary: {
      DE: "Wassereintritt im Dachgeschoss nach Sturm. 2 Wohnungen betroffen.",
      EN: "Water ingress in attic after storm. 2 apartments affected.",
    },
    contractorName: "Dachdecker Hansen",
    amountLabel: "€ 8.900",
    timeline: { DE: "10 Werktage", EN: "10 business days" },
    recommendation: {
      DE: "Empfohlen: Angebot marktgerecht, Versicherung deckt voraussichtlich 60 %.",
      EN: "Recommended: quote is in line with market, insurance likely covers 60%.",
    },
    risk: "medium",
    urgency: "high" as const,
  },
  {
    id: "AP-105",
    propertyName: "Parkallee 110",
    title: { DE: "Aufzugswartung – Jahresvertrag", EN: "Elevator maintenance — annual contract" },
    summary: {
      DE: "Verlängerung des Wartungsvertrags inkl. 24/7 Notdienst.",
      EN: "Renewal of maintenance contract including 24/7 emergency service.",
    },
    contractorName: "Schindler Service",
    amountLabel: "€ 5.700",
    timeline: { DE: "Laufzeit 12 Monate", EN: "12-month term" },
    recommendation: {
      DE: "Zur Prüfung: Preis +6 % YoY. Alternativangebot von Kone verfügbar (€ 5.200).",
      EN: "Review: price +6% YoY. Alternative quote from Kone available (EUR 5,200).",
    },
    risk: "low",
    urgency: "medium" as const,
  },
];

const ownerInvoices = [
  {
    id: "INV-2041",
    dateLabel: "24.05.2026",
    contractorName: "Müller Heizung GmbH",
    propertyName: "Lindenstraße 22",
    amountLabel: "€ 1.240",
    status: "paid",
  },
  {
    id: "INV-2039",
    dateLabel: "22.05.2026",
    contractorName: "Klempner Schulz & Söhne",
    propertyName: "Goethestraße 8",
    amountLabel: "€ 680",
    status: "paid",
  },
  {
    id: "INV-2037",
    dateLabel: "20.05.2026",
    contractorName: "Schindler Service",
    propertyName: "Parkallee 110",
    amountLabel: "€ 2.150",
    status: "pending",
  },
  {
    id: "INV-2030",
    dateLabel: "18.05.2026",
    contractorName: "Gutachter Bauer",
    propertyName: "Rosenweg 3",
    amountLabel: "€ 890",
    status: "pending",
  },
  {
    id: "INV-2025",
    dateLabel: "15.05.2026",
    contractorName: "Hausmeister Krüger",
    propertyName: "Lindenstraße 22",
    amountLabel: "€ 120",
    status: "paid",
  },
];

async function resetDatabase() {
  await db.delete(notificationsTable);
  await db.delete(aiActivities);
  await db.delete(approvals);
  await db.delete(invoices);
  await db.delete(documents);
  await db.delete(ticketAssignments);
  await db.delete(ticketEvents);
  await db.delete(ticketsTable);
  await db.delete(tenants);
  await db.delete(units);
  await db.delete(contractorsTable);
  await db.delete(userRoles);
  await db.delete(users);
  await db.delete(propertiesTable);
  await db.delete(organizations);
}

function propertyIdByName(name: string) {
  return properties.find((property) => property.name === name || property.name.replace(/ß/g, "ss") === name)?.id;
}

async function seed() {
  await resetDatabase();

  await db.insert(organizations).values({
    id: ORG_ID,
    name: "Hausverwaltung Berlin GmbH",
    type: "property_management",
  });

  await db.insert(users).values(
    roleOrder.map((role) => {
      const meta = ROLE_META[role];
      return {
        id: demoUserId(role),
        organizationId: ORG_ID,
        displayName: meta.person.DE,
        email: null,
        phone: null,
        preferredLanguage: "DE",
        initials: meta.initials,
        demoRole: role,
        meta,
      };
    }),
  );

  await db.insert(userRoles).values(
    roleOrder.map((role) => ({
      id: `role-${role}`,
      userId: demoUserId(role),
      role,
    })),
  );

  await db.insert(propertiesTable).values(
    properties.map((property) => ({
      id: property.id,
      organizationId: ORG_ID,
      name: property.name,
      address: property.address,
      city: property.city,
      units: property.units,
      openTickets: property.openTickets,
      criticalTickets: property.criticalTickets,
      managerName: property.manager,
      avgResponseMin: property.avgResponseMin,
      status: property.status,
      yearBuilt: property.yearBuilt,
      type: property.type,
      aiSummary: property.aiSummary,
    })),
  );

  const unitRows = properties.flatMap((property) =>
    property.unitsList.map((unit, index) => ({
      id: `unit-${property.id}-${index + 1}`,
      propertyId: property.id,
      label: unit.label,
      labelLocalized: { DE: unit.label, EN: unit.label } satisfies LocalizedText,
      tenantName: unit.tenant,
      status: unit.status,
    })),
  );
  await db.insert(units).values(unitRows);

  const tenantMap = new Map<string, typeof tenants.$inferInsert>();
  for (const property of properties) {
    for (const [index, unit] of property.unitsList.entries()) {
      const id = `tenant-${slug(unit.tenant)}-${property.id}`;
      tenantMap.set(id, {
        id,
        userId: unit.tenant === "Anna Becker" ? demoUserId("tenant") : null,
        propertyId: property.id,
        unitId: `unit-${property.id}-${index + 1}`,
        name: unit.tenant,
        phone: null,
        email: null,
        preferredLanguage: "DE",
        apartment: { DE: unit.label, EN: unit.label },
        building: property.name,
      });
    }
  }

  for (const ticket of tickets) {
    const tenantId = `tenant-${slug(ticket.tenant.name)}-${ticket.propertyId}`;
    tenantMap.set(tenantId, {
      id: tenantId,
      userId: ticket.tenant.name === "Anna Becker" ? demoUserId("tenant") : null,
      propertyId: ticket.propertyId,
      unitId: unitRows.find((unit) => unit.propertyId === ticket.propertyId && unit.tenantName === ticket.tenant.name)?.id,
      name: ticket.tenant.name,
      phone: ticket.tenant.phone,
      email: null,
      preferredLanguage: ticket.tenant.language,
      apartment: ticket.tenant.apartment,
      building: ticket.tenant.building,
    });
  }
  await db.insert(tenants).values([...tenantMap.values()]);

  await db.insert(contractorsTable).values(
    allContractors.map((contractor) => ({
      id: contractor.id,
      organizationId: ORG_ID,
      userId: contractor.id === "c1" ? demoUserId("contractor") : null,
      name: contractor.name,
      specialty: contractor.specialty,
      specialtyKey: contractor.specialtyKey,
      rating: contractor.rating.toFixed(1),
      reviews: contractor.reviews,
      etaHours: contractor.etaHours,
      available: contractor.available,
      city: contractor.city,
      serviceArea: contractor.serviceArea,
      priceRange: contractor.priceRange,
      topMatch: contractor.topMatch ?? false,
      preferred: contractor.preferred ?? false,
      phone: contractor.phone,
      email: contractor.email,
      activeJobs: contractor.activeJobs,
      pastJobs: contractor.pastJobs,
      avgCompletionHours: contractor.avgCompletionHours,
      reliability: contractor.reliability,
      aiReason: contractor.aiReason,
    })),
  );

  await db.insert(ticketsTable).values(
    tickets.map((ticket) => ({
      id: ticket.id,
      organizationId: ORG_ID,
      propertyId: ticket.propertyId,
      tenantId: `tenant-${slug(ticket.tenant.name)}-${ticket.propertyId}`,
      contractorId: ticket.contractorId ?? null,
      title: ticket.title,
      category: ticket.category,
      categoryKey: ticket.categoryKey,
      tenantSnapshot: ticket.tenant,
      status: ticket.status,
      urgency: ticket.urgency,
      confidence: ticket.confidence,
      contractorName: ticket.contractorName ?? null,
      waitingHours: ticket.waitingHours,
      createdAtLabel: ticket.createdAt,
      summary: ticket.summary,
      description: ticket.description,
      language: ticket.language,
      photos: ticket.photos,
      suggestedActions: ticket.suggestedActions,
    })),
  );

  await db.insert(ticketEvents).values(
    tickets.flatMap((ticket) =>
      ticket.history.map((event, index) => ({
        id: `${ticket.id}-event-${index + 1}`,
        ticketId: ticket.id,
        type: event.type,
        actorName:
          event.type === "tenant"
            ? ticket.tenant.name
            : event.type === "manager"
              ? "Sarah Krüger"
              : event.type === "contractor"
                ? (ticket.contractorName ?? null)
                : "Valta AI",
        atLabel: event.at,
        text: event.text,
        sequence: index + 1,
      })),
    ),
  );

  const assignedTickets = tickets.filter((ticket) => ticket.contractorId);
  if (assignedTickets.length > 0) {
    await db.insert(ticketAssignments).values(
      assignedTickets.map((ticket) => ({
        id: `${ticket.id}-${ticket.contractorId}`,
        ticketId: ticket.id,
        contractorId: ticket.contractorId!,
        status: ticket.status === "resolved" ? "completed" : "assigned",
        etaHours: allContractors.find((contractor) => contractor.id === ticket.contractorId)?.etaHours ?? null,
        assignedByUserId: demoUserId("pm"),
      })),
    );
  }

  await db.insert(documents).values(
    [
      ...properties.flatMap((property) =>
        property.documents.map((document, index) => ({
          id: `doc-${property.id}-${index + 1}`,
          propertyId: property.id,
          ticketId: null,
          name: document.name,
          type: document.type,
          updatedLabel: document.updated,
          url: null,
        })),
      ),
      ...tickets.flatMap((ticket) =>
        Array.from({ length: ticket.photos }).map((_, index) => ({
          id: `photo-${ticket.id}-${index + 1}`,
          propertyId: null,
          ticketId: ticket.id,
          name: `Foto ${index + 1}`,
          type: "image",
          updatedLabel: ticket.createdAt.DE,
          url: null,
        })),
      ),
    ],
  );

  await db.insert(notificationsTable).values(
    fullNotifications.map((notification) => ({
      ...notification,
      recipientUserId: demoUserId("pm"),
    })),
  );

  await db.insert(aiActivities).values(
    aiActivity.map((activity, index) => ({
      id: `ai-activity-${index + 1}`,
      organizationId: ORG_ID,
      atLabel: activity.at,
      text: activity.text,
      sequence: index + 1,
    })),
  );

  await db.insert(approvals).values(
    ownerApprovals.map((approval) => ({
      id: approval.id,
      organizationId: ORG_ID,
      propertyId: propertyIdByName(approval.propertyName) ?? null,
      title: approval.title,
      summary: approval.summary,
      contractorName: approval.contractorName,
      amountLabel: approval.amountLabel,
      amountCents: cents(approval.amountLabel),
      timeline: approval.timeline,
      recommendation: approval.recommendation,
      risk: approval.risk,
      urgency: approval.urgency,
      status: "pending" as const,
    })),
  );

  await db.insert(invoices).values(
    ownerInvoices.map((invoice) => ({
      id: invoice.id,
      organizationId: ORG_ID,
      propertyId: propertyIdByName(invoice.propertyName) ?? null,
      contractorName: invoice.contractorName,
      propertyName: invoice.propertyName,
      dateLabel: invoice.dateLabel,
      amountLabel: invoice.amountLabel,
      amountCents: cents(invoice.amountLabel),
      status: invoice.status,
    })),
  );
}

seed()
  .then(() => {
    console.log("Seeded Neon with current Valta demo data.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
