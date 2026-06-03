import type { Lang, TicketDto } from "@/lib/api/types";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ticketTopic(ticket: TicketDto) {
  return normalize(`${ticket.category.DE} ${ticket.category.EN} ${ticket.title.DE} ${ticket.title.EN} ${ticket.summary.DE} ${ticket.summary.EN}`);
}

export function buildReplyDraft(ticket: TicketDto, language: Lang) {
  const firstName = ticket.tenant.name.split(" ")[0];
  const topic = ticketTopic(ticket);
  const contractor = ticket.contractorName ?? (language === "EN" ? "a suitable contractor" : "einen passenden Fachbetrieb");

  if (topic.includes("wasser") || topic.includes("plumb") || topic.includes("sanitar") || topic.includes("leak")) {
    return language === "EN"
      ? `Hi ${firstName},\n\nthanks for your report. We have forwarded the water leak to ${contractor}. Please keep the area dry if possible and avoid using the affected fixture until the contractor confirms next steps.\n\nBest\nYour property management`
      : `Hallo ${firstName},\n\nvielen Dank für Ihre Meldung. Wir haben das Wasserleck an ${contractor} weitergegeben. Bitte halten Sie den Bereich soweit möglich trocken und nutzen Sie die betroffene Armatur nicht, bis der Fachbetrieb die nächsten Schritte bestätigt.\n\nBeste Grüße\nIhre Hausverwaltung`;
  }

  if (topic.includes("heiz") || topic.includes("heat")) {
    return language === "EN"
      ? `Hi ${firstName},\n\nthanks for your report. We've dispatched an emergency technician - ETA today between 11:00 and 13:00. You'll get an update once they're on the way.\n\nBest\nYour property management`
      : `Hallo ${firstName},\n\nvielen Dank für Ihre Meldung. Wir haben einen Heizungsnotdienst beauftragt - ETA heute zwischen 11:00 und 13:00 Uhr. Sie erhalten ein Update, sobald der Techniker unterwegs ist.\n\nBeste Grüße\nIhre Hausverwaltung`;
  }

  return language === "EN"
    ? `Hi ${firstName},\n\nthanks for your report. We have recorded your request and are checking the next operational step. You'll receive an update shortly.\n\nBest\nYour property management`
    : `Hallo ${firstName},\n\nvielen Dank für Ihre Meldung. Wir haben Ihr Anliegen aufgenommen und prüfen den nächsten operativen Schritt. Sie erhalten in Kürze ein Update.\n\nBeste Grüße\nIhre Hausverwaltung`;
}

