import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import { tickets, type Ticket } from "@/lib/mockData";
import {
  Search,
  Filter,
  Sparkles,
  Languages,
  CheckCheck,
  Pencil,
  Send,
  Wrench,
  ChevronRight,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Operations Inbox · Valta" },
      { name: "description", content: "AI-priorisierte Inbox für Hausverwaltungen – mit Copilot-Vorschlägen, Übersetzung und Freigabe." },
    ],
  }),
  component: InboxPage,
});

const filters = ["Alle", "Kritisch", "Neu", "Wartet auf Info", "In Bearbeitung"] as const;

function InboxPage() {
  const [selectedId, setSelectedId] = useState(tickets[0].id);
  const [filter, setFilter] = useState<(typeof filters)[number]>("Alle");
  const [translated, setTranslated] = useState(false);
  const [draftEdit, setDraftEdit] = useState(false);

  const list = useMemo(() => {
    if (filter === "Alle") return tickets;
    if (filter === "Kritisch") return tickets.filter((t) => t.urgency === "critical" || t.urgency === "high");
    if (filter === "Neu") return tickets.filter((t) => t.status === "new");
    if (filter === "Wartet auf Info") return tickets.filter((t) => t.status === "waiting");
    return tickets.filter((t) => t.status === "in_progress");
  }, [filter]);

  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0];

  return (
    <AppShell title="Operations Inbox" subtitle="AI triagiert · Mensch entscheidet">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_360px] h-[calc(100vh-4rem)]">
        {/* List */}
        <aside className="border-r border-border bg-surface flex flex-col min-h-0">
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder="Tickets durchsuchen…" className="w-full bg-transparent outline-none" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] border transition-colors",
                    filter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {f}
                </button>
              ))}
              <button className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <Filter className="h-3 w-3" /> Mehr
              </button>
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-border">
            {list.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-accent/40 transition-colors",
                    selectedId === t.id && "bg-accent",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{t.id}</span>
                    <UrgencyBadge urgency={t.urgency} />
                    <span className="ml-auto text-[11px] text-muted-foreground">{t.createdAt}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.tenant.name} · {t.tenant.apartment}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    <AIBadge confidence={t.confidence} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Detail */}
        <section className="overflow-y-auto bg-background min-h-0">
          <TicketDetail ticket={selected} translated={translated} onTranslate={() => setTranslated((v) => !v)} />
        </section>

        {/* Copilot */}
        <aside className="border-l border-border bg-surface overflow-y-auto min-h-0">
          <CopilotPanel ticket={selected} draftEdit={draftEdit} setDraftEdit={setDraftEdit} />
        </aside>
      </div>
    </AppShell>
  );
}

function TicketDetail({ ticket, translated, onTranslate }: { ticket: Ticket; translated: boolean; onTranslate: () => void }) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/inbox" className="hover:text-foreground">Inbox</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{ticket.id}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{ticket.title}</h2>
          <UrgencyBadge urgency={ticket.urgency} />
          <StatusBadge status={ticket.status} />
          <AIBadge confidence={ticket.confidence} />
          <button
            onClick={onTranslate}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent"
          >
            <Languages className="h-3.5 w-3.5" /> {translated ? "Original (DE)" : "Auf Englisch anzeigen"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border ai-gradient p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-ai" /> AI-Zusammenfassung
        </div>
        <p className="mt-2 text-sm leading-relaxed">
          {translated
            ? "Tenant reports complete heating failure since yesterday evening. Outside temperature below 5 °C. Entire apartment affected. High urgency recommended."
            : ticket.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard label="Mieter:in" value={ticket.tenant.name} sub={ticket.tenant.phone} />
        <InfoCard label="Objekt / Wohneinheit" value={ticket.tenant.apartment} sub={ticket.tenant.building} />
        <InfoCard label="Kategorie" value={ticket.category} sub={`Sprache ${ticket.language}`} />
        <InfoCard label="Empfohlener Handwerker" value={ticket.contractor ?? "—"} sub="Auf Basis Kategorie & Historie" />
      </div>

      <section>
        <h3 className="text-sm font-semibold mb-2">Kommunikationsverlauf</h3>
        <ol className="rounded-xl border border-border bg-surface divide-y divide-border">
          {ticket.history.map((h, i) => (
            <li key={i} className="flex gap-3 p-3 text-sm">
              <span className="w-12 shrink-0 text-[11px] text-muted-foreground">{h.at}</span>
              <span className={cn(
                "rounded-md px-2 py-0.5 text-[11px] h-fit",
                h.type === "ai" && "bg-ai/10 text-ai",
                h.type === "tenant" && "bg-info/10 text-info-foreground",
                h.type === "manager" && "bg-primary/10 text-primary",
                h.type === "contractor" && "bg-success/15 text-success-foreground",
              )}>{h.type === "ai" ? "AI" : h.type === "tenant" ? "Mieter" : h.type === "manager" ? "Verwalter" : "Handwerker"}</span>
              <p className="flex-1 leading-snug">{h.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {ticket.photos > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">Angehängte Fotos ({ticket.photos})</h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: ticket.photos }).map((_, i) => (
              <div key={i} className="aspect-video rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function CopilotPanel({ ticket, draftEdit, setDraftEdit }: { ticket: Ticket; draftEdit: boolean; setDraftEdit: (v: boolean) => void }) {
  const draft = `Hallo ${ticket.tenant.name.split(" ")[0]},\n\nvielen Dank für Ihre Meldung. Wir haben einen Heizungsnotdienst (Müller GmbH) beauftragt – ETA heute zwischen 11:00 und 13:00 Uhr. Sie erhalten ein Update, sobald der Techniker unterwegs ist.\n\nBeste Grüße\nIhre Hausverwaltung`;
  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-ai" /> AI Copilot
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Vorschläge – Sie behalten die Kontrolle.</p>
      </div>

      <div className="rounded-xl border border-border bg-background p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Antwortentwurf</span>
          <AIBadge confidence={94} />
        </div>
        {draftEdit ? (
          <textarea defaultValue={draft} className="w-full h-40 text-sm rounded-md border border-border bg-surface p-2 outline-none focus:ring-2 focus:ring-ring" />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-snug text-foreground/90">{draft}</pre>
        )}
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <CheckCheck className="h-3.5 w-3.5" /> Freigeben & senden
          </button>
          <button onClick={() => setDraftEdit(!draftEdit)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent">
            <Pencil className="h-3.5 w-3.5" /> {draftEdit ? "Fertig" : "Bearbeiten"}
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent">
            <Send className="h-3.5 w-3.5" /> Manuell
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Dringlichkeits-Einschätzung
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          Kritisch – Heizungsausfall bei Außentemp. &lt; 5 °C, gesamte Wohnung betroffen. SLA-Frist: 4 Std.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Wrench className="h-3.5 w-3.5 text-primary" /> Handwerker-Empfehlung
        </div>
        <ul className="space-y-1.5 text-sm">
          <ContractorRow name="Müller Heizung GmbH" rating="4.9" eta="2 Std." top />
          <ContractorRow name="Therm-Service Berlin" rating="4.6" eta="4 Std." />
          <ContractorRow name="HeizFix 24" rating="4.4" eta="heute" />
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-background p-3 space-y-2">
        <div className="text-xs font-semibold">Empfohlene nächste Schritte</div>
        <ul className="space-y-1.5">
          {ticket.suggestedActions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ContractorRow({ name, rating, eta, top }: { name: string; rating: string; eta: string; top?: boolean }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-surface p-2">
      <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center"><Wrench className="h-3.5 w-3.5" /></div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground">★ {rating} · ETA {eta}</div>
      </div>
      {top && <span className="text-[10px] uppercase tracking-wider bg-ai/10 text-ai rounded px-1.5 py-0.5">Top-Match</span>}
    </li>
  );
}
