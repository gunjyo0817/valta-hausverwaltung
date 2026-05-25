import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "DE" | "EN";

const dict = {
  // Dashboard
  "dash.greeting": { DE: "Guten Morgen, Sarah", EN: "Good morning, Sarah" },
  "dash.sub": {
    DE: "Hier ist, was in Ihrem Portfolio heute Aufmerksamkeit braucht.",
    EN: "Here's what needs your attention across the portfolio today.",
  },
  "kpi.open": { DE: "Offene Tickets", EN: "Open tickets" },
  "kpi.response": { DE: "Ø Reaktionszeit", EN: "Avg. response time" },
  "kpi.ai": { DE: "AI-Vorschläge übernommen", EN: "AI suggestions accepted" },
  "kpi.urgent": { DE: "Kritische Fälle", EN: "Critical cases" },
  "kpi.pending": { DE: "Wartet auf Handwerker", EN: "Awaiting contractor" },
  "section.active": { DE: "Aktive Tickets", EN: "Active tickets" },
  "section.active.sub": {
    DE: "Sortiert nach Dringlichkeit – Copilot triagiert in Echtzeit.",
    EN: "Sorted by urgency — Copilot triages in real time.",
  },
  "section.ai_activity": { DE: "AI Assistant · Aktivität", EN: "AI Assistant · activity" },
  "section.notifications": { DE: "Benachrichtigungen", EN: "Notifications" },

  // Nav
  "nav.dashboard": { DE: "Dashboard", EN: "Dashboard" },
  "nav.inbox": { DE: "Operations Inbox", EN: "Operations Inbox" },
  "nav.insights": { DE: "AI Insights", EN: "AI Insights" },
  "nav.properties": { DE: "Objekte", EN: "Properties" },
  "nav.contractors": { DE: "Handwerker", EN: "Contractors" },
  "nav.tenant_view": { DE: "Mieter-Sicht (Demo)", EN: "Tenant view (demo)" },
  "nav.intake": { DE: "Tenant Intake", EN: "Tenant Intake" },
  "nav.portal": { DE: "Tenant Portal", EN: "Tenant Portal" },
  "nav.section_hv": { DE: "Hausverwaltung", EN: "Property management" },

  // Actions
  "act.new_ticket": { DE: "Neues Ticket", EN: "New ticket" },
  "act.approve": { DE: "Freigeben & senden", EN: "Approve & send" },
  "act.edit": { DE: "Bearbeiten", EN: "Edit" },
  "act.manual": { DE: "Manuell", EN: "Send manually" },
  "act.assign": { DE: "Handwerker zuweisen", EN: "Assign contractor" },
  "act.request_info": { DE: "Mehr Infos anfordern", EN: "Request more info" },
  "act.request_quote": { DE: "Angebot anfordern", EN: "Request quote" },
  "act.send_summary": { DE: "Zusammenfassung senden", EN: "Send summary" },

  // Common
  "common.search": { DE: "Tickets, Mieter, Objekte suchen…", EN: "Search tickets, tenants, properties…" },
  "common.tenant": { DE: "Mieter:in", EN: "Tenant" },
  "common.manager": { DE: "Verwalter", EN: "Manager" },
  "common.ai": { DE: "AI", EN: "AI" },
  "common.contractor": { DE: "Handwerker", EN: "Contractor" },
  "common.timeline": { DE: "Kommunikationsverlauf", EN: "Communication timeline" },
  "common.summary": { DE: "AI-Zusammenfassung", EN: "AI summary" },
  "common.show_original": { DE: "Original (DE)", EN: "Show original (DE)" },
  "common.show_en": { DE: "Auf Englisch anzeigen", EN: "Translated to English" },
} as const;

type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "DE",
  setLang: () => {},
  t: (k) => dict[k].DE,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("DE");
  const t = (k: Key) => dict[k][lang];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
