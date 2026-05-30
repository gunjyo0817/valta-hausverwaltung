import type {
  AiContractorSuggestionDto,
  AiMissingInfoDto,
  AiReplyDraftDto,
  AiStructuredIntakeDto,
  AiSummaryDto,
  AiTranslationDto,
  AiUrgencyDto,
  Lang,
  TicketDto,
  Urgency,
} from "@/lib/api/types";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function firstMatch(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1]?.trim() ?? "";
}

export function classifyUrgencyFallback(text: string): Omit<AiUrgencyDto, "kind" | "model" | "status"> {
  const normalized = normalize(text);
  const criticalSignals = ["komplett ausgefallen", "complete", "notdienst", "urgent", "dringend", "wasser lauft", "leak", "heating down"];
  const highSignals = ["schimmel", "mould", "aufzug", "elevator", "strom", "electrical", "kein warmwasser"];
  const priority: Urgency = criticalSignals.some((signal) => normalized.includes(signal))
    ? "critical"
    : highSignals.some((signal) => normalized.includes(signal))
      ? "high"
      : normalized.includes("termin") || normalized.includes("appointment")
        ? "medium"
        : "low";

  return {
    priority,
    confidence: priority === "critical" ? 96 : priority === "high" ? 88 : 74,
    reasons: priority === "critical"
      ? ["Complete outage or urgent wording detected"]
      : priority === "high"
        ? ["Potential habitability or building-system issue detected"]
        : ["No immediate emergency signal detected"],
  };
}

export function suggestContractorFallback(category: string): Omit<AiContractorSuggestionDto, "kind" | "model" | "status"> {
  const normalized = normalize(category);
  if (normalized.includes("heiz") || normalized.includes("heat")) {
    return {
      contractor: "Müller Heizung GmbH",
      contractorId: "c1",
      confidence: 94,
      reason: "Preferred Berlin heating partner with fastest emergency ETA.",
    };
  }
  if (normalized.includes("wasser") || normalized.includes("plumb") || normalized.includes("sanitar")) {
    return {
      contractor: "Klempner Schulz & Söhne",
      contractorId: "c4",
      confidence: 88,
      reason: "Preferred plumbing partner for water and sanitary issues.",
    };
  }
  if (normalized.includes("elektr") || normalized.includes("electric")) {
    return {
      contractor: "Elektro Bauer",
      contractorId: "c3",
      confidence: 86,
      reason: "Main electrical partner with strong completion history.",
    };
  }
  if (normalized.includes("aufzug") || normalized.includes("elevator")) {
    return {
      contractor: "Schindler Service",
      contractorId: "c8",
      confidence: 90,
      reason: "Contracted elevator service partner.",
    };
  }
  if (normalized.includes("schimmel") || normalized.includes("mould") || normalized.includes("mold")) {
    return {
      contractor: "Gutachter Bauer",
      contractorId: "c9",
      confidence: 84,
      reason: "Specialist for moisture and mould assessment.",
    };
  }
  return {
    contractor: "Hausmeister Krüger",
    contractorId: "c10",
    confidence: 70,
    reason: "General same-day maintenance partner.",
  };
}

function detectPropertyId(raw: string) {
  const normalized = normalize(raw);
  if (normalized.includes("linden")) return "p-lindenstr-22";
  if (normalized.includes("goethe")) return "p-goethestr-8";
  if (normalized.includes("parkallee")) return "p-parkallee-110";
  if (normalized.includes("haupt")) return "p-hauptstr-5";
  if (normalized.includes("rosen")) return "p-rosenweg-3";
  if (normalized.includes("frankfurter")) return "p-frankfurter-88";
  return "p-lindenstr-22";
}

function detectCategory(raw: string, language: Lang) {
  const normalized = normalize(raw);
  if (normalized.includes("heiz") || normalized.includes("heat")) return language === "EN" ? "Heating" : "Heizung";
  if (normalized.includes("wasser") || normalized.includes("leak") || normalized.includes("sanitar")) return language === "EN" ? "Plumbing" : "Sanitär";
  if (normalized.includes("strom") || normalized.includes("elektr") || normalized.includes("power")) return language === "EN" ? "Electrics" : "Elektrik";
  if (normalized.includes("aufzug") || normalized.includes("elevator")) return language === "EN" ? "Elevator" : "Aufzug";
  if (normalized.includes("schimmel") || normalized.includes("mould") || normalized.includes("mold")) return language === "EN" ? "Mould" : "Schimmel";
  return language === "EN" ? "Other" : "Sonstiges";
}

export function structureIntakeFallback(raw: string, language: Lang): Omit<AiStructuredIntakeDto, "kind" | "model" | "status"> {
  const category = detectCategory(raw, language);
  const urgency = classifyUrgencyFallback(raw);
  const contractor = suggestContractorFallback(category);
  const isAnnaSample = normalize(raw).includes("anna becker") && normalize(raw).includes("linden");

  if (isAnnaSample) {
    return {
      title: language === "EN" ? "Heating cold since last night" : "Heizung kalt seit gestern Abend",
      category,
      priority: "critical",
      tenant: "Anna Becker",
      propertyId: "p-lindenstr-22",
      unit: language === "EN" ? "Unit 14, 3rd floor" : "WE 14, 3. OG",
      phone: "+49 30 1234567",
      email: "anna.becker@example.de",
      description: language === "EN"
        ? "Heating completely down since yesterday evening, cold despite max setting. Tenant reachable weekdays from 4 pm."
        : "Heizung seit gestern Abend komplett ausgefallen, kalt trotz voller Reglerstellung. Mieterin werktags ab 16 Uhr erreichbar.",
      contractor: "Müller Heizung GmbH",
      confidence: 96,
      access: language === "EN" ? "Tenant home from 4 pm" : "Mieterin zuhause ab 16 Uhr",
      preferred: language === "EN" ? "Today 4-7 pm" : "Heute 16-19 Uhr",
      missing: [],
    };
  }

  const email = firstMatch(raw, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  const phone = firstMatch(raw, /(\+?\d[\d\s()./-]{6,}\d)/);
  const tenant = firstMatch(raw, /(?:Viele Gr[üu]ße|Best|Regards|Name:)\s*\n?([A-ZÄÖÜ][\wÄÖÜäöüß.-]+(?:\s+[A-ZÄÖÜ][\wÄÖÜäöüß.-]+)+)/i) || "Unbekannte:r Mieter:in";
  const unit = firstMatch(raw, /\b((?:WE|Unit)\s*\d+[^),\n]*)/i);

  return {
    title: category,
    category,
    priority: urgency.priority,
    tenant,
    propertyId: detectPropertyId(raw),
    unit,
    phone,
    email,
    description: raw.trim().slice(0, 360),
    contractor: contractor.contractor,
    confidence: Math.min(urgency.confidence, contractor.confidence),
    access: "",
    preferred: "",
    missing: [
      !phone ? "phone" : "",
      !unit ? "unit" : "",
    ].filter(Boolean),
  };
}

export function generateSummaryFallback(ticket: TicketDto, language: Lang): Omit<AiSummaryDto, "kind" | "model" | "status"> {
  return {
    summary: ticket.summary[language] || ticket.description[language],
    confidence: ticket.confidence,
  };
}

export function generateReplyDraftFallback(ticket: TicketDto, language: Lang): Omit<AiReplyDraftDto, "kind" | "model" | "status"> {
  const firstName = ticket.tenant.name.split(" ")[0];
  return {
    text: language === "EN"
      ? `Hi ${firstName},\n\nthanks for your report. We've dispatched an emergency technician - ETA today between 11:00 and 13:00. You'll get an update once they're on the way.\n\nBest\nYour property management`
      : `Hallo ${firstName},\n\nvielen Dank für Ihre Meldung. Wir haben einen Heizungsnotdienst beauftragt - ETA heute zwischen 11:00 und 13:00 Uhr. Sie erhalten ein Update, sobald der Techniker unterwegs ist.\n\nBeste Grüße\nIhre Hausverwaltung`,
    confidence: 94,
  };
}

export function detectMissingInfoFallback(_ticket: TicketDto, language: Lang): Omit<AiMissingInfoDto, "kind" | "model" | "status"> {
  return {
    text: language === "EN"
      ? "Please send the exact thermostat model and confirm whether neighbours are affected."
      : "Bitte senden Sie den genauen Thermostat-Typ und bestätigen Sie, ob Nachbarn ebenfalls betroffen sind.",
    items: language === "EN"
      ? ["Exact thermostat model", "Confirmation: are neighbours affected?"]
      : ["Genauer Thermostat-Typ", "Bestätigung: Sind Nachbarn betroffen?"],
    confidence: 90,
  };
}

export function translateTextFallback(text: string, to: Lang): Omit<AiTranslationDto, "kind" | "model" | "status"> {
  return {
    text,
    to,
    confidence: 0,
  };
}
