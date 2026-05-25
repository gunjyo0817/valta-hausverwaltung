import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import { getTicket } from "@/lib/mockData";
import { ArrowLeft, Sparkles, Wrench, Phone, MapPin, Image as ImageIcon, Languages, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/ticket/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Valta` },
      { name: "description", content: "AI-strukturiertes Reparatur-Ticket mit Zusammenfassung, Handwerker-Empfehlung und Verlauf." },
    ],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { id } = useParams({ from: "/ticket/$id" });
  const t = getTicket(id);
  return (
    <AppShell title={`${t.id} · ${t.title}`} subtitle={`${t.tenant.building} · ${t.tenant.apartment}`}>
      <div className="p-4 md:p-8">
        <Link to="/inbox" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" /> Zurück zur Inbox
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <UrgencyBadge urgency={t.urgency} />
                <StatusBadge status={t.status} />
                <AIBadge confidence={t.confidence} />
                <button className="ml-auto inline-flex items-center gap-1.5 text-xs border border-border rounded-md px-2 py-1 hover:bg-accent">
                  <Languages className="h-3.5 w-3.5" /> DE / EN
                </button>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">{t.title}</h2>
              <div className="mt-4 rounded-xl ai-gradient p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-ai" /> AI-generierte Zusammenfassung
                </div>
                <p className="mt-2 text-sm leading-relaxed">{t.summary}</p>
              </div>
              <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{t.description}</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <h3 className="text-sm font-semibold mb-3">Kommunikationsverlauf</h3>
              <ol className="space-y-3">
                {t.history.map((h, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 text-[11px] text-muted-foreground">{h.at}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] h-fit ${
                      h.type === "ai" ? "bg-ai/10 text-ai" :
                      h.type === "tenant" ? "bg-info/10 text-info-foreground" :
                      h.type === "manager" ? "bg-primary/10 text-primary" :
                      "bg-success/15 text-success-foreground"
                    }`}>{h.type === "ai" ? "AI" : h.type === "tenant" ? "Mieter" : h.type === "manager" ? "Verwalter" : "Handwerker"}</span>
                    <p className="flex-1 leading-snug">{h.text}</p>
                  </li>
                ))}
              </ol>
            </div>

            {t.photos > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <h3 className="text-sm font-semibold mb-3">Angehängte Fotos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: t.photos }).map((_, i) => (
                    <div key={i} className="aspect-video rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <h3 className="text-sm font-semibold mb-3">Mieter:in</h3>
              <div className="text-sm font-medium">{t.tenant.name}</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{t.tenant.building} · {t.tenant.apartment}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{t.tenant.phone}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Empfohlener Handwerker</h3>
              </div>
              <div className="text-sm font-medium">{t.contractor ?? "Heizungstechniker"}</div>
              <div className="text-xs text-muted-foreground">Top-Match nach Kategorie, Verfügbarkeit & Bewertung.</div>
              <button className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                <CheckCheck className="h-3.5 w-3.5" /> Beauftragen
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-ai" />
                <h3 className="text-sm font-semibold">Empfohlene nächste Schritte</h3>
              </div>
              <ul className="space-y-2">
                {t.suggestedActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ai" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
