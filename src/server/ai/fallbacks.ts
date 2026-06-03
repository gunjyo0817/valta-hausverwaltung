import type {
  AiContractorSuggestionDto,
  AiIntakeFollowUpDto,
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
import { buildReplyDraft } from "@/lib/ticketCopy";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function firstMatch(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1]?.trim() ?? "";
}

export function classifyUrgencyFallback(text: string, language: Lang = "EN"): Omit<AiUrgencyDto, "kind" | "model" | "status"> {
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
      ? language === "DE"
        ? ["Kompletter Ausfall oder dringende Formulierung erkannt"]
        : ["Complete outage or urgent wording detected"]
      : priority === "high"
        ? language === "DE"
          ? ["Mögliches Wohnbarkeits- oder Gebäudetechnikproblem erkannt"]
          : ["Potential habitability or building-system issue detected"]
        : language === "DE"
          ? ["Kein unmittelbares Notfallsignal erkannt"]
          : ["No immediate emergency signal detected"],
  };
}

export function suggestContractorFallback(category: string, language: Lang = "EN"): Omit<AiContractorSuggestionDto, "kind" | "model" | "status"> {
  const normalized = normalize(category);
  if (normalized.includes("heiz") || normalized.includes("heat")) {
    return {
      contractor: "Müller Heizung GmbH",
      contractorId: "c1",
      confidence: 94,
      reason: language === "DE"
        ? "Bevorzugter Berliner Heizungs-Partner mit schnellster Notfall-ETA."
        : "Preferred Berlin heating partner with fastest emergency ETA.",
    };
  }
  if (normalized.includes("wasser") || normalized.includes("plumb") || normalized.includes("sanitar")) {
    return {
      contractor: "Klempner Schulz & Söhne",
      contractorId: "c4",
      confidence: 88,
      reason: language === "DE"
        ? "Bevorzugter Sanitär-Partner für Wasser- und Rohrprobleme."
        : "Preferred plumbing partner for water and sanitary issues.",
    };
  }
  if (normalized.includes("elektr") || normalized.includes("electric")) {
    return {
      contractor: "Elektro Bauer",
      contractorId: "c3",
      confidence: 86,
      reason: language === "DE"
        ? "Hauptpartner für Elektrik mit starker Abschlussquote."
        : "Main electrical partner with strong completion history.",
    };
  }
  if (normalized.includes("aufzug") || normalized.includes("elevator")) {
    return {
      contractor: "Schindler Service",
      contractorId: "c8",
      confidence: 90,
      reason: language === "DE"
        ? "Vertragspartner für Aufzugsservice."
        : "Contracted elevator service partner.",
    };
  }
  if (normalized.includes("schimmel") || normalized.includes("mould") || normalized.includes("mold")) {
    return {
      contractor: "Gutachter Bauer",
      contractorId: "c9",
      confidence: 84,
      reason: language === "DE"
        ? "Spezialist für Feuchte- und Schimmelbegutachtung."
        : "Specialist for moisture and mould assessment.",
    };
  }
  return {
    contractor: "Hausmeister Krüger",
    contractorId: "c10",
    confidence: 70,
    reason: language === "DE"
      ? "Allgemeiner Wartungspartner für kleinere Aufträge am selben Tag."
      : "General same-day maintenance partner.",
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
  const urgency = classifyUrgencyFallback(raw, language);
  const contractor = suggestContractorFallback(category, language);
  const normalized = normalize(raw);
  const isAnnaHeatingSample =
    normalized.includes("anna becker") &&
    normalized.includes("linden") &&
    (category === "Heizung" || category === "Heating" || normalized.includes("heiz") || normalized.includes("heat"));

  if (isAnnaHeatingSample) {
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
  const unit = firstMatch(raw, /\b((?:WE|Unit)\s*\d+(?:\s*,?\s*\d+\.\s*OG)?)/i);

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

export function generateIntakeFollowUpFallback(raw: string, language: Lang, step = 0): Omit<AiIntakeFollowUpDto, "kind" | "model" | "status"> {
  const normalized = normalize(raw);
  const category = detectCategory(raw, language);
  const hasUnit = /\b(we|unit|apt|apartment|wohnung)\s*\d+|\d+\.\s*og|linden|goethe|parkallee|hauptstr|rosenweg|frankfurter/.test(normalized);
  const hasPhone = /\+?\d[\d\s()./-]{6,}\d/.test(raw);
  const hasAccess = /zugang|access|techniker|technician|jederzeit|any time|vormittag|morning|nach\s*17|after\s*5|ab\s*\d|call|anrufen/.test(normalized);
  const hasPhoto = /foto|photo|bild|image|attached|angehangt|anhang/.test(normalized);

  const byCategory = () => {
    if (category === "Heizung" || category === "Heating") {
      return language === "EN"
        ? { question: "Is the heating affected in the whole apartment or only in specific rooms?", chips: ["Whole apartment", "One room", "Only radiators"] }
        : { question: "Ist die Heizung in der ganzen Wohnung betroffen oder nur in einzelnen Räumen?", chips: ["Ganze Wohnung", "Ein Raum", "Nur Heizkörper"] };
    }
    if (category === "Sanitär" || category === "Plumbing") {
      return language === "EN"
        ? { question: "Is water still actively leaking, and where exactly is it coming from?", chips: ["Still leaking", "Stopped now", "Under sink", "Ceiling/wall"] }
        : { question: "Läuft aktuell noch Wasser aus, und wo genau tritt es aus?", chips: ["Läuft noch", "Jetzt gestoppt", "Unter Spüle", "Decke/Wand"] };
    }
    if (category === "Elektrik" || category === "Electrics") {
      return language === "EN"
        ? { question: "Is this a full power outage or limited to one circuit, outlet, or fixture?", chips: ["Full outage", "One room", "Outlet", "Light"] }
        : { question: "Ist der Strom komplett ausgefallen oder nur ein Stromkreis, eine Steckdose oder eine Lampe betroffen?", chips: ["Komplett", "Ein Raum", "Steckdose", "Licht"] };
    }
    if (category === "Aufzug" || category === "Elevator") {
      return language === "EN"
        ? { question: "Is anyone trapped in the elevator, or is it simply out of service?", chips: ["Person trapped", "Out of service", "Door issue"] }
        : { question: "Ist jemand im Aufzug eingeschlossen oder ist er nur außer Betrieb?", chips: ["Person eingeschlossen", "Außer Betrieb", "Türproblem"] };
    }
    if (category === "Schimmel" || category === "Mould") {
      return language === "EN"
        ? { question: "Where is the mould visible and roughly how large is the affected area?", chips: ["Bedroom", "Bathroom", "Small area", "Large area"] }
        : { question: "Wo ist der Schimmel sichtbar und wie groß ist die betroffene Fläche ungefähr?", chips: ["Schlafzimmer", "Bad", "Kleine Fläche", "Große Fläche"] };
    }
    return language === "EN"
      ? { question: "Can you add the exact location and what changed since it last worked?", chips: ["Kitchen", "Bathroom", "Hallway", "Since today"] }
      : { question: "Können Sie den genauen Ort nennen und was sich seit der letzten Funktion geändert hat?", chips: ["Küche", "Bad", "Flur", "Seit heute"] };
  };

  if (step <= 1) {
    const next = byCategory();
    return { ...next, ready: false, confidence: 82 };
  }

  if (!hasUnit) {
    return language === "EN"
      ? { question: "Which building and unit is this for?", chips: ["Lindenstraße 22 · WE 14", "Goethestraße 8 · WE 3", "Parkallee 110"], ready: false, confidence: 84 }
      : { question: "Für welches Gebäude und welche Wohneinheit ist die Meldung?", chips: ["Lindenstraße 22 · WE 14", "Goethestraße 8 · WE 3", "Parkallee 110"], ready: false, confidence: 84 };
  }

  if (!hasPhoto && step <= 3) {
    return language === "EN"
      ? { question: "Would you like to attach a photo so property management can assess it faster?", chips: ["Add photo", "Skip"], ready: false, confidence: 78 }
      : { question: "Möchten Sie ein Foto anhängen, damit die Hausverwaltung es schneller einschätzen kann?", chips: ["Foto hinzufügen", "Überspringen"], ready: false, confidence: 78 };
  }

  if (!hasAccess) {
    return language === "EN"
      ? { question: "When may a technician access the apartment, and should they call first?", chips: ["Any time", "Weekday mornings", "After 5 pm", "Call first"], ready: false, confidence: 82 }
      : { question: "Wann darf ein Techniker in die Wohnung, und soll er vorher anrufen?", chips: ["Jederzeit", "Werktags vormittags", "Nach 17 Uhr", "Vorher anrufen"], ready: false, confidence: 82 };
  }

  if (!hasPhone && step <= 5) {
    return language === "EN"
      ? { question: "What phone number should the property manager or contractor use for this request?", chips: ["Use stored phone", "+49 30 1234567"], ready: false, confidence: 76 }
      : { question: "Welche Telefonnummer soll die Hausverwaltung oder der Handwerker für diese Meldung nutzen?", chips: ["Gespeicherte Nummer", "+49 30 1234567"], ready: false, confidence: 76 };
  }

  return {
    question: "",
    chips: [],
    ready: true,
    confidence: 88,
  };
}

export function generateSummaryFallback(ticket: TicketDto, language: Lang): Omit<AiSummaryDto, "kind" | "model" | "status"> {
  return {
    summary: ticket.summary[language] || ticket.description[language],
    confidence: ticket.confidence,
  };
}

export function generateReplyDraftFallback(ticket: TicketDto, language: Lang): Omit<AiReplyDraftDto, "kind" | "model" | "status"> {
  return {
    text: buildReplyDraft(ticket, language),
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
