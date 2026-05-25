import { useState } from "react";
import { Sparkles, Wrench, Phone, Mail, FileText, X, CheckCircle2, Star } from "lucide-react";
import { contractors } from "@/lib/contractors";
import { cn } from "@/lib/utils";

export function AssignContractorModal({ category, onClose }: { category: string; onClose: () => void }) {
  const list = contractors[category] ?? contractors["Heating"];
  const [selected, setSelected] = useState<string | null>(list[0]?.id ?? null);
  const [assigned, setAssigned] = useState(false);

  if (assigned) {
    return (
      <Backdrop onClose={onClose}>
        <div className="p-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold">Handwerker beauftragt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ticket-Zusammenfassung wurde per E-Mail und SMS gesendet. Mieter:in wurde benachrichtigt.
          </p>
          <button onClick={onClose} className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            Fertig
          </button>
        </div>
      </Backdrop>
    );
  }

  return (
    <Backdrop onClose={onClose}>
      <header className="flex items-center gap-2 p-4 border-b border-border">
        <Wrench className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Handwerker zuweisen</h3>
          <p className="text-xs text-muted-foreground">AI-vorgeschlagene Auswahl · Sortiert nach Verfügbarkeit & Bewertung</p>
        </div>
        <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent"><X className="h-4 w-4" /></button>
      </header>

      <ul className="max-h-[420px] overflow-y-auto divide-y divide-border">
        {list.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => setSelected(c.id)}
              className={cn(
                "w-full text-left p-4 flex items-center gap-3 hover:bg-accent/40 transition-colors",
                selected === c.id && "bg-accent",
              )}
            >
              <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  {c.topMatch && <span className="text-[10px] uppercase tracking-wider bg-ai/10 text-ai rounded px-1.5 py-0.5 inline-flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />Top-Match</span>}
                </div>
                <div className="text-xs text-muted-foreground">{c.specialty} · {c.city}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{c.rating} ({c.reviews})</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{c.priceRange}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className={cn("rounded px-1.5 py-0.5", c.available ? "bg-success/15 text-success-foreground" : "bg-muted text-muted-foreground")}>
                    {c.available ? `Verfügbar · ETA ${c.etaHours}h` : "Nicht verfügbar"}
                  </span>
                </div>
              </div>
              <div className={cn("h-4 w-4 rounded-full border-2 shrink-0", selected === c.id ? "border-primary bg-primary" : "border-border")} />
            </button>
          </li>
        ))}
      </ul>

      <footer className="p-4 border-t border-border bg-surface-muted space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> AI erstellt Auftragszusammenfassung, fügt Fotos & Adresse an.
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent">
            <Mail className="h-3.5 w-3.5" /> Angebot anfordern
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent">
            <Phone className="h-3.5 w-3.5" /> Direkt anrufen
          </button>
          <button
            disabled={!selected}
            onClick={() => setAssigned(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Beauftragen & Zusammenfassung senden
          </button>
        </div>
      </footer>
    </Backdrop>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-pop overflow-hidden animate-in zoom-in-95 duration-150">
        {children}
      </div>
    </div>
  );
}
