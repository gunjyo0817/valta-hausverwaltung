export type Contractor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  etaHours: number;
  available: boolean;
  city: string;
  priceRange: string;
  topMatch?: boolean;
};

export const contractors: Record<string, Contractor[]> = {
  Heating: [
    { id: "c1", name: "Müller Heizung GmbH", specialty: "Heizungsnotdienst", rating: 4.9, reviews: 312, etaHours: 2, available: true, city: "Berlin", priceRange: "€€", topMatch: true },
    { id: "c2", name: "Therm-Service Berlin", specialty: "Heizung & Sanitär", rating: 4.6, reviews: 178, etaHours: 4, available: true, city: "Berlin", priceRange: "€€" },
    { id: "c3", name: "HeizFix 24", specialty: "24/7 Notdienst", rating: 4.4, reviews: 96, etaHours: 6, available: true, city: "Berlin", priceRange: "€€€" },
  ],
  "Water leak": [
    { id: "c4", name: "Klempner Schulz & Söhne", specialty: "Klempner & Sanitär", rating: 4.8, reviews: 244, etaHours: 1, available: true, city: "München", priceRange: "€€", topMatch: true },
    { id: "c5", name: "AquaStop München", specialty: "Wasserschäden", rating: 4.5, reviews: 132, etaHours: 3, available: true, city: "München", priceRange: "€€€" },
  ],
  Internet: [
    { id: "c6", name: "Vodafone Business Support", specialty: "Anbieterstörung", rating: 4.1, reviews: 1820, etaHours: 24, available: true, city: "remote", priceRange: "—", topMatch: true },
    { id: "c7", name: "NetTech Köln", specialty: "Netzwerk vor Ort", rating: 4.6, reviews: 88, etaHours: 8, available: false, city: "Köln", priceRange: "€€" },
  ],
  Elevator: [
    { id: "c8", name: "Schindler Service", specialty: "Aufzugswartung", rating: 4.7, reviews: 530, etaHours: 5, available: true, city: "Hamburg", priceRange: "€€€", topMatch: true },
  ],
  Mold: [
    { id: "c9", name: "Gutachter Bauer", specialty: "Schimmelgutachten", rating: 4.8, reviews: 64, etaHours: 48, available: true, city: "Leipzig", priceRange: "€€€", topMatch: true },
  ],
  Lighting: [
    { id: "c10", name: "Hausmeister Krüger", specialty: "Hausmeisterservice", rating: 4.9, reviews: 412, etaHours: 4, available: true, city: "Berlin", priceRange: "€" },
  ],
};

export const insights = {
  resolutionTrend: [42, 38, 35, 33, 28, 24, 22, 19, 18, 15, 14, 12], // hours per week
  volumeByCategory: [
    { label: "Heizung", value: 34, color: "bg-destructive" },
    { label: "Wasser", value: 22, color: "bg-info" },
    { label: "Elektrik", value: 14, color: "bg-warning" },
    { label: "Internet", value: 11, color: "bg-primary" },
    { label: "Aufzug", value: 7, color: "bg-ai" },
    { label: "Sonstiges", value: 12, color: "bg-muted-foreground" },
  ],
  automationRate: 68, // % of tickets where AI draft was accepted as-is
  avgResolutionHours: 14,
  slaBreaches: 3,
  responseTrend: [22, 19, 16, 14, 12, 11, 12, 10, 9, 11, 10, 8], // minutes
  atRisk: [
    { id: "VLT-2030", title: "Schimmel im Schlafzimmer", hours: 36, reason: "Wartet auf Gutachter > 24 Std." },
    { id: "VLT-2018", title: "Fenster undicht", hours: 52, reason: "Keine Mieter-Antwort seit 2 Tagen" },
    { id: "VLT-2009", title: "Sprechanlage defekt", hours: 71, reason: "SLA überschritten" },
  ],
};
