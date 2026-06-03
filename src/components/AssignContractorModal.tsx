import { useEffect, useState } from "react";
import { Sparkles, Wrench, Phone, Mail, FileText, X, CheckCircle2, Star } from "lucide-react";
import { contractors } from "@/lib/contractors";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useAddTicketEvent, useAssignContractor } from "@/lib/api";

function defaultScheduleValue(hours = 2) {
  const date = new Date();
  date.setHours(date.getHours() + Math.max(hours, 1));
  date.setMinutes(0, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function AssignContractorModal({ ticketId, category, onClose }: { ticketId: string; category: string; onClose: () => void }) {
  const { t, lang } = useLang();
  const list = contractors[category] ?? contractors["Heating"];
  const [selected, setSelected] = useState<string | null>(list[0]?.id ?? null);
  const [assigned, setAssigned] = useState(false);
  const [quoteRequested, setQuoteRequested] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const assignContractor = useAssignContractor();
  const addTicketEvent = useAddTicketEvent();
  const selectedContractor = list.find((contractor) => contractor.id === selected);
  const [scheduledFor, setScheduledFor] = useState(defaultScheduleValue(selectedContractor?.etaHours));

  useEffect(() => {
    setScheduledFor(defaultScheduleValue(selectedContractor?.etaHours));
  }, [selectedContractor?.etaHours]);

  const submitAssignment = async () => {
    if (!selected || assignContractor.isPending) return;
    setActionError(null);
    try {
      await assignContractor.mutateAsync({ data: { ticketId, contractorId: selected, scheduledFor: new Date(scheduledFor).toISOString() } });
      setAssigned(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : lang === "EN" ? "Assignment failed." : "Beauftragung fehlgeschlagen.");
    }
  };

  const requestQuote = async () => {
    if (!selectedContractor || addTicketEvent.isPending || quoteRequested) return;
    setActionError(null);
    try {
      await addTicketEvent.mutateAsync({
        data: {
          ticketId,
          type: "manager",
          actorName: "Sarah Krüger",
          text: lang === "EN"
            ? `Demo quote request sent to ${selectedContractor.name}.`
            : `Demo-Angebotsanfrage an ${selectedContractor.name} gesendet.`,
          role: "pm",
        },
      });
      setQuoteRequested(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : lang === "EN" ? "Quote request failed." : "Angebotsanfrage fehlgeschlagen.");
    }
  };

  if (assigned) {
    return (
      <Backdrop onClose={onClose}>
        <div className="p-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold">{lang === "EN" ? "Contractor dispatched" : "Handwerker beauftragt"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "EN" ? "Ticket summary sent by email and SMS. Tenant has been notified." : "Ticket-Zusammenfassung wurde per E-Mail und SMS gesendet. Mieter:in wurde benachrichtigt."}
          </p>
          <button onClick={onClose} className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            {t("act.done")}
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
          <h3 className="text-sm font-semibold">{t("act.assign")}</h3>
          <p className="text-xs text-muted-foreground">{lang === "EN" ? "AI-recommended selection · sorted by availability & rating" : "AI-vorgeschlagene Auswahl · Sortiert nach Verfügbarkeit & Bewertung"}</p>
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
                <div className="text-xs text-muted-foreground">{c.specialty[lang]} · {c.city}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{c.rating} ({c.reviews})</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{c.priceRange}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className={cn("rounded px-1.5 py-0.5", c.available ? "bg-success/15 text-success-foreground" : "bg-muted text-muted-foreground")}>
                    {c.available ? `${t("common.available")} · ${t("common.eta")} ${c.etaHours}${t("common.hours_short")}` : t("common.unavailable")}
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
          <FileText className="h-3.5 w-3.5" /> {lang === "EN" ? "AI generates job summary, attaches photos & address." : "AI erstellt Auftragszusammenfassung, fügt Fotos & Adresse an."}
        </div>
        <label className="block text-xs text-muted-foreground">
          <span className="mb-1 block font-medium text-foreground">{lang === "EN" ? "Scheduled appointment" : "Geplanter Termin"}</span>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!selectedContractor || addTicketEvent.isPending || quoteRequested}
            onClick={requestQuote}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
          >
            <Mail className="h-3.5 w-3.5" /> {quoteRequested ? (lang === "EN" ? "Quote requested" : "Angebot angefragt") : t("act.request_quote")}
          </button>
          <a href={selectedContractor ? `tel:${selectedContractor.phone}` : undefined} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent">
            <Phone className="h-3.5 w-3.5" /> {t("act.call")}
          </a>
          <button
            disabled={!selected}
            onClick={submitAssignment}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> {assignContractor.isPending ? t("common.loading") : t("act.send_summary")}
          </button>
        </div>
        {actionError && <div className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">{actionError}</div>}
        {quoteRequested && <div className="rounded-md bg-success/10 px-2.5 py-1.5 text-xs text-success-foreground">{lang === "EN" ? "The quote request was recorded in the ticket timeline." : "Die Angebotsanfrage wurde in der Ticket-Timeline gespeichert."}</div>}
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
