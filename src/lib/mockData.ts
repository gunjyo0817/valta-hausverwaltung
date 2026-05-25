export type TicketStatus =
  | "new"
  | "waiting"
  | "in_progress"
  | "contractor_assigned"
  | "resolved";

export type Urgency = "low" | "medium" | "high" | "critical";

export interface Ticket {
  id: string;
  title: string;
  category: string;
  tenant: { name: string; apartment: string; building: string; phone: string; language: "DE" | "EN" };
  status: TicketStatus;
  urgency: Urgency;
  confidence: number; // 0-100
  contractor?: string;
  waitingHours: number;
  createdAt: string;
  summary: string;
  description: string;
  language: "DE" | "EN";
  photos: number;
  history: Array<{ at: string; type: "tenant" | "ai" | "manager" | "contractor"; text: string }>;
  suggestedActions: string[];
}

export const tickets: Ticket[] = [
  {
    id: "VLT-2041",
    title: "Heizung komplett ausgefallen",
    category: "Heating",
    tenant: { name: "Anna Becker", apartment: "WE 14, 3. OG", building: "Lindenstraße 22, Berlin", phone: "+49 30 1234567", language: "DE" },
    status: "new",
    urgency: "critical",
    confidence: 96,
    waitingHours: 1,
    createdAt: "vor 1 Std.",
    language: "DE",
    photos: 2,
    summary:
      "Mieterin meldet kompletten Heizungsausfall seit gestern Abend. Außentemperatur unter 5 °C. Betrifft die gesamte Wohnung. Hohe Dringlichkeit empfohlen.",
    description:
      "Die Heizung in der ganzen Wohnung ist seit ca. 19:00 Uhr ausgefallen. Thermostate reagieren nicht, Heizkörper sind kalt. Es ist sehr kalt in der Wohnung.",
    contractor: "Heizungstechniker (Vorschlag)",
    history: [
      { at: "08:42", type: "tenant", text: "Heizung geht nicht mehr, sehr kalt." },
      { at: "08:42", type: "ai", text: "Seit wann besteht das Problem? Betrifft es alle Räume?" },
      { at: "08:44", type: "tenant", text: "Seit gestern Abend, alle Räume." },
      { at: "08:45", type: "ai", text: "Ticket erstellt – Priorität: Kritisch. Empfehlung: Heizungsnotdienst." },
    ],
    suggestedActions: [
      "Heizungsnotdienst Müller GmbH beauftragen",
      "Mieterin per SMS über ETA informieren",
      "Backup-Heizgerät als Übergang anbieten",
    ],
  },
  {
    id: "VLT-2039",
    title: "Wasserschaden Küche",
    category: "Water leak",
    tenant: { name: "Mehmet Yilmaz", apartment: "WE 4, EG", building: "Goethestraße 8, München", phone: "+49 89 2233445", language: "DE" },
    status: "in_progress",
    urgency: "high",
    confidence: 89,
    waitingHours: 4,
    createdAt: "vor 4 Std.",
    language: "DE",
    photos: 3,
    summary:
      "Wasseraustritt unter Spüle, sichtbare Pfütze. Hauptwasser bisher nicht abgestellt. Risiko von Wasserschaden im darunterliegenden Geschoss.",
    description: "Unter der Spüle läuft Wasser, vermutlich Siphon undicht. Pfütze breitet sich aus.",
    contractor: "Klempner Schulz & Söhne",
    history: [
      { at: "06:10", type: "tenant", text: "Wasser läuft unter Spüle aus." },
      { at: "06:11", type: "ai", text: "Bitte Hauptwasser abstellen, falls möglich. Foto?" },
      { at: "06:18", type: "tenant", text: "Foto hochgeladen." },
      { at: "06:25", type: "manager", text: "Klempner Schulz beauftragt – ETA 11:00." },
    ],
    suggestedActions: ["Status-Update an Nachbarn unten senden", "Foto an Klempner weiterleiten"],
  },
  {
    id: "VLT-2037",
    title: "Aufzug außer Betrieb",
    category: "Elevator",
    tenant: { name: "Sophia Klein", apartment: "WE 22, 6. OG", building: "Parkallee 110, Hamburg", phone: "+49 40 998877", language: "DE" },
    status: "contractor_assigned",
    urgency: "high",
    confidence: 92,
    waitingHours: 8,
    createdAt: "vor 8 Std.",
    language: "DE",
    photos: 0,
    summary:
      "Aufzug seit heute Morgen außer Betrieb. Mehrere ältere Mieter:innen betroffen. Wartungsfirma kontaktiert, ETA heute Nachmittag.",
    description: "Aufzug bleibt im EG stehen, Türen öffnen sich nicht.",
    contractor: "Schindler Service",
    history: [
      { at: "07:30", type: "tenant", text: "Aufzug funktioniert nicht." },
      { at: "07:31", type: "ai", text: "Ticket erstellt, Wartungsdienst informiert." },
      { at: "09:10", type: "contractor", text: "Techniker eingeplant für 14:00." },
    ],
    suggestedActions: ["Aushang im Treppenhaus generieren", "Mieter über App benachrichtigen"],
  },
  {
    id: "VLT-2034",
    title: "Internetausfall im gesamten Haus",
    category: "Internet",
    tenant: { name: "Lukas Wagner", apartment: "WE 9, 2. OG", building: "Hauptstraße 5, Köln", phone: "+49 221 445566", language: "DE" },
    status: "waiting",
    urgency: "medium",
    confidence: 74,
    waitingHours: 12,
    createdAt: "gestern",
    language: "DE",
    photos: 0,
    summary:
      "Mehrere Mieter:innen melden Internetausfall. Vermutlich Störung des Providers. Warte auf Bestätigung von Vodafone Business.",
    description: "Internet geht seit gestern Abend nicht mehr. Router-Neustart hat nichts gebracht.",
    history: [
      { at: "20:02", type: "tenant", text: "Internet weg." },
      { at: "20:03", type: "ai", text: "Andere Mieter haben dasselbe gemeldet – wahrscheinlich Provider-Störung." },
    ],
    suggestedActions: ["Provider-Ticket eröffnen", "Statusseite an Mieter senden"],
  },
  {
    id: "VLT-2030",
    title: "Schimmel im Schlafzimmer",
    category: "Mold",
    tenant: { name: "Clara Hoffmann", apartment: "WE 7, 1. OG", building: "Rosenweg 3, Leipzig", phone: "+49 341 778899", language: "DE" },
    status: "waiting",
    urgency: "medium",
    confidence: 81,
    waitingHours: 36,
    createdAt: "vor 2 Tagen",
    language: "DE",
    photos: 4,
    summary:
      "Schimmel an Außenwand im Schlafzimmer, ca. 40×30 cm. Mieterin meldet erstmaliges Auftreten. Empfehlung: Fachgutachter zur Ursachenanalyse.",
    description: "Dunkle Flecken an der Wand hinter dem Bett. Riecht muffig.",
    history: [{ at: "Mo 11:00", type: "tenant", text: "Schimmel entdeckt, Fotos angehängt." }],
    suggestedActions: ["Gutachter Bauer beauftragen", "Mieterin Lüftungs-Leitfaden senden"],
  },
  {
    id: "VLT-2025",
    title: "Treppenhausbeleuchtung defekt",
    category: "Lighting",
    tenant: { name: "Jonas Richter", apartment: "WE 12, 4. OG", building: "Lindenstraße 22, Berlin", phone: "+49 30 6677889", language: "DE" },
    status: "resolved",
    urgency: "low",
    confidence: 99,
    waitingHours: 0,
    createdAt: "vor 3 Tagen",
    language: "DE",
    photos: 1,
    summary: "Defekte Leuchtmittel im 4. OG. Hausmeister hat ausgetauscht.",
    description: "Licht geht im Treppenhaus nicht an.",
    contractor: "Hausmeister Krüger",
    history: [
      { at: "Fr 09:00", type: "tenant", text: "Licht im Treppenhaus defekt." },
      { at: "Fr 14:00", type: "contractor", text: "Leuchtmittel getauscht." },
    ],
    suggestedActions: [],
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

export const aiActivity = [
  { at: "vor 2 Min.", text: "Ticket VLT-2041 als kritisch eingestuft (Heizungsausfall, < 5 °C)." },
  { at: "vor 8 Min.", text: "Antwortentwurf für VLT-2039 erstellt." },
  { at: "vor 14 Min.", text: "Kontraktor 'Schulz & Söhne' für Wasserschaden vorgeschlagen." },
  { at: "vor 22 Min.", text: "3 doppelte Tickets zu Internetausfall zusammengeführt." },
  { at: "vor 41 Min.", text: "Übersetzung EN → DE für 2 Anfragen." },
];

export const notifications = [
  { at: "09:14", text: "Neuer kritischer Vorfall: Heizung – Lindenstraße 22" },
  { at: "08:55", text: "Schindler bestätigt Termin 14:00 (Aufzug)" },
  { at: "08:30", text: "Mieter Yilmaz hat Foto hochgeladen" },
];
