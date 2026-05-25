export type Document = { name: string; type: string; updated: string };

export type Property = {
  id: string;
  name: string; // street + number
  address: string;
  city: string;
  units: number;
  openTickets: number;
  criticalTickets: number;
  manager: string;
  avgResponseMin: number;
  status: "healthy" | "attention" | "urgent";
  yearBuilt: number;
  type: { DE: string; EN: string };
  aiSummary: { DE: string; EN: string };
  unitsList: { label: string; tenant: string; status: { DE: string; EN: string } }[];
  documents: Document[];
};

const bi = (de: string, en: string) => ({ DE: de, EN: en });

export const properties: Property[] = [
  {
    id: "p-lindenstr-22",
    name: "Lindenstraße 22",
    address: "Lindenstraße 22, 10969 Berlin",
    city: "Berlin",
    units: 28,
    openTickets: 2,
    criticalTickets: 1,
    manager: "Sarah Krüger",
    avgResponseMin: 11,
    status: "urgent",
    yearBuilt: 1978,
    type: bi("Mehrfamilienhaus", "Apartment building"),
    aiSummary: bi(
      "Aktiver Heizungs-Notfall in WE 14. Allgemein stabiles Objekt mit niedriger Ticket-Rate. Heizungswartung war zuletzt 2024-09.",
      "Active heating emergency in unit 14. Generally stable building with low ticket volume. Last heating service was 2024-09.",
    ),
    unitsList: [
      { label: "WE 14, 3. OG", tenant: "Anna Becker", status: bi("Heizungsausfall", "Heating failure") },
      { label: "WE 12, 4. OG", tenant: "Jonas Richter", status: bi("Stabil", "Healthy") },
      { label: "WE 7, 2. OG", tenant: "Familie Demir", status: bi("Stabil", "Healthy") },
      { label: "WE 5, 1. OG", tenant: "Markus Vogel", status: bi("Stabil", "Healthy") },
    ],
    documents: [
      { name: "Mietvertrag-Vorlage.pdf", type: "PDF", updated: "2024-09-14" },
      { name: "Heizungs-Wartungsprotokoll.pdf", type: "PDF", updated: "2024-09-02" },
      { name: "Grundriss-Treppenhaus.pdf", type: "PDF", updated: "2022-03-01" },
    ],
  },
  {
    id: "p-goethestr-8",
    name: "Goethestraße 8",
    address: "Goethestraße 8, 80336 München",
    city: "München",
    units: 14,
    openTickets: 1,
    criticalTickets: 0,
    manager: "Sarah Krüger",
    avgResponseMin: 9,
    status: "attention",
    yearBuilt: 1995,
    type: bi("Wohnanlage", "Residential complex"),
    aiSummary: bi(
      "Wasserschaden in WE 4 wird aktuell behoben. Risiko für Etage darunter überwacht. Keine offenen Mängel an Gemeinschaftsbereichen.",
      "Water leak in unit 4 currently being fixed. Risk for the floor below is being monitored. No open issues in common areas.",
    ),
    unitsList: [
      { label: "WE 4, EG", tenant: "Mehmet Yilmaz", status: bi("Wasserschaden", "Water leak") },
      { label: "WE 3, EG", tenant: "Tanja Lorenz", status: bi("Beobachten", "Watch") },
      { label: "WE 9, 2. OG", tenant: "Familie Weiss", status: bi("Stabil", "Healthy") },
    ],
    documents: [
      { name: "Haftpflicht-Versicherung.pdf", type: "PDF", updated: "2025-01-10" },
      { name: "Sanitär-Wartungsplan.pdf", type: "PDF", updated: "2024-11-22" },
    ],
  },
  {
    id: "p-parkallee-110",
    name: "Parkallee 110",
    address: "Parkallee 110, 20144 Hamburg",
    city: "Hamburg",
    units: 42,
    openTickets: 3,
    criticalTickets: 0,
    manager: "Tobias Lang",
    avgResponseMin: 14,
    status: "attention",
    yearBuilt: 2008,
    type: bi("Hochhaus", "High-rise") ,
    aiSummary: bi(
      "Aufzug außer Betrieb seit heute Morgen, Schindler vor Ort. Senioren-Hotline informiert. Brandschutz-Wartung steht in 4 Wochen an.",
      "Elevator down since this morning, Schindler on site. Senior helpline notified. Fire-safety inspection due in 4 weeks.",
    ),
    unitsList: [
      { label: "WE 22, 6. OG", tenant: "Sophia Klein", status: bi("Aufzug betroffen", "Affected by elevator") },
      { label: "WE 41, 11. OG", tenant: "Familie Köhler", status: bi("Aufzug betroffen", "Affected by elevator") },
      { label: "WE 5, 2. OG", tenant: "Petra Maier", status: bi("Stabil", "Healthy") },
    ],
    documents: [
      { name: "Aufzugs-Wartungsvertrag.pdf", type: "PDF", updated: "2024-06-01" },
      { name: "Brandschutz-Konzept.pdf", type: "PDF", updated: "2023-11-15" },
    ],
  },
  {
    id: "p-hauptstr-5",
    name: "Hauptstraße 5",
    address: "Hauptstraße 5, 50667 Köln",
    city: "Köln",
    units: 18,
    openTickets: 1,
    criticalTickets: 0,
    manager: "Tobias Lang",
    avgResponseMin: 18,
    status: "attention",
    yearBuilt: 1985,
    type: bi("Mehrfamilienhaus", "Apartment building"),
    aiSummary: bi(
      "Internet-Sammelstörung im Haus, Provider-Ticket offen. Mieter-Updates automatisch durch Valta.",
      "Building-wide internet outage, provider ticket open. Tenant updates handled automatically by Valta.",
    ),
    unitsList: [
      { label: "WE 9, 2. OG", tenant: "Lukas Wagner", status: bi("Internet aus", "Internet down") },
      { label: "WE 6, 1. OG", tenant: "Familie Albrecht", status: bi("Internet aus", "Internet down") },
    ],
    documents: [
      { name: "Internet-Sammelvertrag.pdf", type: "PDF", updated: "2024-02-04" },
    ],
  },
  {
    id: "p-rosenweg-3",
    name: "Rosenweg 3",
    address: "Rosenweg 3, 04109 Leipzig",
    city: "Leipzig",
    units: 10,
    openTickets: 1,
    criticalTickets: 0,
    manager: "Yasemin Aydın",
    avgResponseMin: 22,
    status: "attention",
    yearBuilt: 1962,
    type: bi("Altbau", "Pre-war building"),
    aiSummary: bi(
      "Schimmel-Fall in WE 7, Gutachter beauftragt. Altbau mit erhöhtem Feuchterisiko – AI empfiehlt jährliche Inspektion.",
      "Mould case in unit 7, surveyor engaged. Older building with elevated moisture risk — AI recommends a yearly inspection.",
    ),
    unitsList: [
      { label: "WE 7, 1. OG", tenant: "Clara Hoffmann", status: bi("Schimmel-Verdacht", "Suspected mould") },
      { label: "WE 4, EG", tenant: "Henry Vogel", status: bi("Stabil", "Healthy") },
    ],
    documents: [
      { name: "Baugutachten-2019.pdf", type: "PDF", updated: "2019-08-12" },
    ],
  },
  {
    id: "p-frankfurter-88",
    name: "Frankfurter Allee 88",
    address: "Frankfurter Allee 88, 60313 Frankfurt",
    city: "Frankfurt",
    units: 36,
    openTickets: 1,
    criticalTickets: 0,
    manager: "Yasemin Aydın",
    avgResponseMin: 10,
    status: "healthy",
    yearBuilt: 2015,
    type: bi("Neubau", "New building"),
    aiSummary: bi(
      "Stabiles Objekt. Einzelne Elektrik-Meldung in WE 3, niedrige Dringlichkeit. Keine SLA-Risiken.",
      "Stable building. Single electrical report in unit 3, low urgency. No SLA risks.",
    ),
    unitsList: [
      { label: "WE 3, 1. OG", tenant: "Elena Fischer", status: bi("Elektrik", "Electrical") },
      { label: "WE 21, 5. OG", tenant: "Familie Roth", status: bi("Stabil", "Healthy") },
    ],
    documents: [
      { name: "Abnahmeprotokoll-2015.pdf", type: "PDF", updated: "2015-11-04" },
      { name: "Energieausweis.pdf", type: "PDF", updated: "2023-04-18" },
    ],
  },
];

export function getProperty(id: string) {
  return properties.find((p) => p.id === id) ?? properties[0];
}
