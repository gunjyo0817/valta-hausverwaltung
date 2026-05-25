export type TicketStatus =
  | "new"
  | "waiting"
  | "in_progress"
  | "contractor_assigned"
  | "resolved";

export type Urgency = "low" | "medium" | "high" | "critical";

export interface HistoryItem {
  at: { DE: string; EN: string };
  type: "tenant" | "ai" | "manager" | "contractor";
  text: { DE: string; EN: string };
}

export interface Ticket {
  id: string;
  title: { DE: string; EN: string };
  category: { DE: string; EN: string };
  categoryKey: string; // for contractor lookup
  tenant: { name: string; apartment: { DE: string; EN: string }; building: string; phone: string; language: "DE" | "EN" };
  propertyId: string;
  status: TicketStatus;
  urgency: Urgency;
  confidence: number;
  contractorId?: string;
  contractorName?: string;
  waitingHours: number;
  createdAt: { DE: string; EN: string };
  summary: { DE: string; EN: string };
  description: { DE: string; EN: string };
  language: "DE" | "EN";
  photos: number;
  history: HistoryItem[];
  suggestedActions: { DE: string; EN: string }[];
}

const bi = (de: string, en: string) => ({ DE: de, EN: en });

export const tickets: Ticket[] = [
  {
    id: "VLT-2041",
    title: bi("Heizung komplett ausgefallen", "Heating completely down"),
    category: bi("Heizung", "Heating"),
    categoryKey: "Heating",
    tenant: { name: "Anna Becker", apartment: bi("WE 14, 3. OG", "Unit 14, 3rd floor"), building: "Lindenstraße 22, Berlin", phone: "+49 30 1234567", language: "DE" },
    propertyId: "p-lindenstr-22",
    status: "new",
    urgency: "critical",
    confidence: 96,
    contractorId: "c1",
    contractorName: "Müller Heizung GmbH",
    waitingHours: 1,
    createdAt: bi("vor 1 Std.", "1 h ago"),
    language: "DE",
    photos: 2,
    summary: bi(
      "Mieterin meldet kompletten Heizungsausfall seit gestern Abend. Außentemperatur unter 5 °C. Betrifft die gesamte Wohnung. Hohe Dringlichkeit empfohlen.",
      "Tenant reports complete heating failure since yesterday evening. Outside temperature below 5 °C. Entire apartment affected. High urgency recommended.",
    ),
    description: bi(
      "Die Heizung in der ganzen Wohnung ist seit ca. 19:00 Uhr ausgefallen. Thermostate reagieren nicht, Heizkörper sind kalt. Es ist sehr kalt in der Wohnung.",
      "The heating in the whole apartment has been out since about 7 pm. Thermostats don't respond, radiators are cold. It's very cold inside.",
    ),
    history: [
      { at: bi("08:42", "08:42"), type: "tenant", text: bi("Heizung geht nicht mehr, sehr kalt.", "Heating is dead, it's very cold.") },
      { at: bi("08:42", "08:42"), type: "ai", text: bi("Seit wann besteht das Problem? Betrifft es alle Räume?", "Since when has this been happening? Does it affect all rooms?") },
      { at: bi("08:44", "08:44"), type: "tenant", text: bi("Seit gestern Abend, alle Räume.", "Since yesterday evening, all rooms.") },
      { at: bi("08:45", "08:45"), type: "ai", text: bi("Ticket erstellt – Priorität: Kritisch. Empfehlung: Heizungsnotdienst.", "Ticket created — priority: critical. Recommendation: emergency heating service.") },
    ],
    suggestedActions: [
      bi("Heizungsnotdienst Müller GmbH beauftragen", "Dispatch emergency heating service Müller GmbH"),
      bi("Mieterin per SMS über ETA informieren", "Notify tenant of ETA by SMS"),
      bi("Backup-Heizgerät als Übergang anbieten", "Offer a backup heater for the interim"),
    ],
  },
  {
    id: "VLT-2039",
    title: bi("Wasserschaden Küche", "Water leak in kitchen"),
    category: bi("Wasserschaden", "Water leak"),
    categoryKey: "Water leak",
    tenant: { name: "Mehmet Yilmaz", apartment: bi("WE 4, EG", "Unit 4, ground floor"), building: "Goethestraße 8, München", phone: "+49 89 2233445", language: "DE" },
    propertyId: "p-goethestr-8",
    status: "in_progress",
    urgency: "high",
    confidence: 89,
    contractorId: "c4",
    contractorName: "Klempner Schulz & Söhne",
    waitingHours: 4,
    createdAt: bi("vor 4 Std.", "4 h ago"),
    language: "DE",
    photos: 3,
    summary: bi(
      "Wasseraustritt unter Spüle, sichtbare Pfütze. Hauptwasser bisher nicht abgestellt. Risiko von Wasserschaden im darunterliegenden Geschoss.",
      "Water leaking under the sink, visible puddle. Main water not yet shut off. Risk of damage to the unit below.",
    ),
    description: bi(
      "Unter der Spüle läuft Wasser, vermutlich Siphon undicht. Pfütze breitet sich aus.",
      "Water is leaking under the sink, probably a faulty siphon. The puddle is spreading.",
    ),
    history: [
      { at: bi("06:10", "06:10"), type: "tenant", text: bi("Wasser läuft unter Spüle aus.", "Water is leaking under the sink.") },
      { at: bi("06:11", "06:11"), type: "ai", text: bi("Bitte Hauptwasser abstellen, falls möglich. Foto?", "Please shut off the main water if possible. Can you send a photo?") },
      { at: bi("06:18", "06:18"), type: "tenant", text: bi("Foto hochgeladen.", "Photo uploaded.") },
      { at: bi("06:25", "06:25"), type: "manager", text: bi("Klempner Schulz beauftragt – ETA 11:00.", "Plumber Schulz dispatched — ETA 11:00.") },
    ],
    suggestedActions: [
      bi("Status-Update an Nachbarn unten senden", "Send status update to the neighbours below"),
      bi("Foto an Klempner weiterleiten", "Forward photo to the plumber"),
    ],
  },
  {
    id: "VLT-2037",
    title: bi("Aufzug außer Betrieb", "Elevator out of service"),
    category: bi("Aufzug", "Elevator"),
    categoryKey: "Elevator",
    tenant: { name: "Sophia Klein", apartment: bi("WE 22, 6. OG", "Unit 22, 6th floor"), building: "Parkallee 110, Hamburg", phone: "+49 40 998877", language: "DE" },
    propertyId: "p-parkallee-110",
    status: "contractor_assigned",
    urgency: "high",
    confidence: 92,
    contractorId: "c8",
    contractorName: "Schindler Service",
    waitingHours: 8,
    createdAt: bi("vor 8 Std.", "8 h ago"),
    language: "DE",
    photos: 0,
    summary: bi(
      "Aufzug seit heute Morgen außer Betrieb. Mehrere ältere Mieter:innen betroffen. Wartungsfirma kontaktiert, ETA heute Nachmittag.",
      "Elevator out of order since this morning. Several elderly tenants affected. Maintenance company contacted, ETA this afternoon.",
    ),
    description: bi("Aufzug bleibt im EG stehen, Türen öffnen sich nicht.", "Elevator stops on the ground floor, doors do not open."),
    history: [
      { at: bi("07:30", "07:30"), type: "tenant", text: bi("Aufzug funktioniert nicht.", "Elevator isn't working.") },
      { at: bi("07:31", "07:31"), type: "ai", text: bi("Ticket erstellt, Wartungsdienst informiert.", "Ticket created, maintenance contractor notified.") },
      { at: bi("09:10", "09:10"), type: "contractor", text: bi("Techniker eingeplant für 14:00.", "Technician scheduled for 14:00.") },
    ],
    suggestedActions: [
      bi("Aushang im Treppenhaus generieren", "Generate notice for the stairwell"),
      bi("Mieter über App benachrichtigen", "Notify tenants via the app"),
    ],
  },
  {
    id: "VLT-2034",
    title: bi("Internetausfall im gesamten Haus", "Internet outage building-wide"),
    category: bi("Internet", "Internet"),
    categoryKey: "Internet",
    tenant: { name: "Lukas Wagner", apartment: bi("WE 9, 2. OG", "Unit 9, 2nd floor"), building: "Hauptstraße 5, Köln", phone: "+49 221 445566", language: "DE" },
    propertyId: "p-hauptstr-5",
    status: "waiting",
    urgency: "medium",
    confidence: 74,
    contractorId: "c6",
    contractorName: "Vodafone Business Support",
    waitingHours: 12,
    createdAt: bi("gestern", "yesterday"),
    language: "DE",
    photos: 0,
    summary: bi(
      "Mehrere Mieter:innen melden Internetausfall. Vermutlich Störung des Providers. Warte auf Bestätigung von Vodafone Business.",
      "Several tenants report an internet outage. Likely a provider issue. Awaiting confirmation from Vodafone Business.",
    ),
    description: bi(
      "Internet geht seit gestern Abend nicht mehr. Router-Neustart hat nichts gebracht.",
      "Internet has been down since yesterday evening. Router restart didn't help.",
    ),
    history: [
      { at: bi("20:02", "20:02"), type: "tenant", text: bi("Internet weg.", "Internet is gone.") },
      { at: bi("20:03", "20:03"), type: "ai", text: bi("Andere Mieter haben dasselbe gemeldet – wahrscheinlich Provider-Störung.", "Other tenants reported the same — likely a provider outage.") },
    ],
    suggestedActions: [
      bi("Provider-Ticket eröffnen", "Open a provider ticket"),
      bi("Statusseite an Mieter senden", "Share status page with tenants"),
    ],
  },
  {
    id: "VLT-2030",
    title: bi("Schimmel im Schlafzimmer", "Mould in bedroom"),
    category: bi("Schimmel", "Mould"),
    categoryKey: "Mold",
    tenant: { name: "Clara Hoffmann", apartment: bi("WE 7, 1. OG", "Unit 7, 1st floor"), building: "Rosenweg 3, Leipzig", phone: "+49 341 778899", language: "DE" },
    propertyId: "p-rosenweg-3",
    status: "waiting",
    urgency: "medium",
    confidence: 81,
    contractorId: "c9",
    contractorName: "Gutachter Bauer",
    waitingHours: 36,
    createdAt: bi("vor 2 Tagen", "2 days ago"),
    language: "DE",
    photos: 4,
    summary: bi(
      "Schimmel an Außenwand im Schlafzimmer, ca. 40×30 cm. Mieterin meldet erstmaliges Auftreten. Empfehlung: Fachgutachter zur Ursachenanalyse.",
      "Mould on the bedroom exterior wall, approx. 40×30 cm. Tenant reports first occurrence. Recommendation: expert assessment.",
    ),
    description: bi(
      "Dunkle Flecken an der Wand hinter dem Bett. Riecht muffig.",
      "Dark spots on the wall behind the bed. Musty smell.",
    ),
    history: [
      { at: bi("Mo 11:00", "Mon 11:00"), type: "tenant", text: bi("Schimmel entdeckt, Fotos angehängt.", "Found mould, photos attached.") },
    ],
    suggestedActions: [
      bi("Gutachter Bauer beauftragen", "Engage Bauer expert"),
      bi("Mieterin Lüftungs-Leitfaden senden", "Send ventilation guide to tenant"),
    ],
  },
  {
    id: "VLT-2025",
    title: bi("Treppenhausbeleuchtung defekt", "Stairwell lighting broken"),
    category: bi("Beleuchtung", "Lighting"),
    categoryKey: "Lighting",
    tenant: { name: "Jonas Richter", apartment: bi("WE 12, 4. OG", "Unit 12, 4th floor"), building: "Lindenstraße 22, Berlin", phone: "+49 30 6677889", language: "DE" },
    propertyId: "p-lindenstr-22",
    status: "resolved",
    urgency: "low",
    confidence: 99,
    contractorId: "c10",
    contractorName: "Hausmeister Krüger",
    waitingHours: 0,
    createdAt: bi("vor 3 Tagen", "3 days ago"),
    language: "DE",
    photos: 1,
    summary: bi(
      "Defekte Leuchtmittel im 4. OG. Hausmeister hat ausgetauscht.",
      "Faulty bulbs on the 4th floor. Caretaker replaced them.",
    ),
    description: bi("Licht geht im Treppenhaus nicht an.", "Stairwell light won't turn on."),
    history: [
      { at: bi("Fr 09:00", "Fri 09:00"), type: "tenant", text: bi("Licht im Treppenhaus defekt.", "Stairwell light broken.") },
      { at: bi("Fr 14:00", "Fri 14:00"), type: "contractor", text: bi("Leuchtmittel getauscht.", "Bulbs replaced.") },
    ],
    suggestedActions: [],
  },
  {
    id: "VLT-2022",
    title: bi("Steckdose im Bad funktioniert nicht", "Bathroom socket dead"),
    category: bi("Elektrik", "Electrical"),
    categoryKey: "Electrical",
    tenant: { name: "Elena Fischer", apartment: bi("WE 3, 1. OG", "Unit 3, 1st floor"), building: "Frankfurter Allee 88, Frankfurt", phone: "+49 69 5544332", language: "DE" },
    propertyId: "p-frankfurter-88",
    status: "new",
    urgency: "low",
    confidence: 84,
    waitingHours: 2,
    createdAt: bi("vor 2 Std.", "2 h ago"),
    language: "DE",
    photos: 0,
    summary: bi(
      "Steckdose im Badezimmer ohne Strom. Sicherung scheint nicht ausgelöst. Empfehlung: Elektriker.",
      "Bathroom socket has no power. Breaker doesn't appear tripped. Recommendation: electrician.",
    ),
    description: bi("Föhn und Rasierer funktionieren nicht mehr.", "Hairdryer and shaver no longer work."),
    history: [
      { at: bi("07:50", "07:50"), type: "tenant", text: bi("Steckdose im Bad geht nicht.", "Bathroom socket doesn't work.") },
      { at: bi("07:51", "07:51"), type: "ai", text: bi("Ticket erstellt, Elektriker vorgeschlagen.", "Ticket created, electrician suggested.") },
    ],
    suggestedActions: [bi("Elektriker beauftragen", "Engage electrician")],
  },
];

export function getTicket(id: string) {
  return tickets.find((t) => t.id === id) ?? tickets[0];
}

export const kpis = {
  openTickets: 27,
  avgResponseMin: 12,
  aiResolved: 41,
  urgent: 4,
  pendingContractor: 6,
};

export const aiActivity: { at: { DE: string; EN: string }; text: { DE: string; EN: string } }[] = [
  { at: bi("vor 2 Min.", "2 min ago"), text: bi("Ticket VLT-2041 als kritisch eingestuft (Heizungsausfall, < 5 °C).", "Classified VLT-2041 as critical (heating failure, < 5 °C).") },
  { at: bi("vor 8 Min.", "8 min ago"), text: bi("Antwortentwurf für VLT-2039 erstellt.", "Drafted reply for VLT-2039.") },
  { at: bi("vor 14 Min.", "14 min ago"), text: bi("Kontraktor 'Schulz & Söhne' für Wasserschaden vorgeschlagen.", "Suggested 'Schulz & Söhne' for the water leak.") },
  { at: bi("vor 22 Min.", "22 min ago"), text: bi("3 doppelte Tickets zu Internetausfall zusammengeführt.", "Merged 3 duplicate tickets about the internet outage.") },
  { at: bi("vor 41 Min.", "41 min ago"), text: bi("Übersetzung EN → DE für 2 Anfragen.", "Translated 2 requests EN → DE.") },
];

export const notifications: { at: string; text: { DE: string; EN: string } }[] = [
  { at: "09:14", text: bi("Neuer kritischer Vorfall: Heizung – Lindenstraße 22", "New critical case: heating — Lindenstraße 22") },
  { at: "08:55", text: bi("Schindler bestätigt Termin 14:00 (Aufzug)", "Schindler confirms 14:00 slot (elevator)") },
  { at: "08:30", text: bi("Mieter Yilmaz hat Foto hochgeladen", "Tenant Yilmaz uploaded a photo") },
];
