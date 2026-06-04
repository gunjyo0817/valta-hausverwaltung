import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { CheckCircle2, Clock, Star, Briefcase, MapPin, User } from "lucide-react";
import { useTickets } from "@/lib/api";
import { isResolvedTicket } from "@/lib/ticketStatus";

export const Route = createFileRoute("/contractor/completed")({ component: Completed });

type Job = {
  id: string;
  title: { DE: string; EN: string };
  category: { DE: string; EN: string };
  property: string;
  tenant: string;
  completedAt: { DE: string; EN: string };
  durationHours: number;
  rating: number;
};

function Completed() {
  const { t, lang } = useLang();
  const ticketsQuery = useTickets();
  const { data } = ticketsQuery;
  const completedTickets = (data ?? []).filter(isResolvedTicket);
  const displayJobs: Job[] = completedTickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        category: ticket.category,
        property: ticket.tenant.building,
        tenant: ticket.tenant.name,
        completedAt: { DE: "jetzt", EN: "now" },
        durationHours: 1.2,
        rating: 5,
      }));

  const total = displayJobs.length;
  const avgHours = total === 0 ? "0.0" : (displayJobs.reduce((s, j) => s + j.durationHours, 0) / total).toFixed(1);
  const avgRating = total === 0 ? "0.0" : (displayJobs.reduce((s, j) => s + j.rating, 0) / total).toFixed(1);
  const onTime = total === 0 ? 0 : Math.round((displayJobs.filter((j) => j.rating >= 4).length / total) * 100);

  return (
    <AppShell title={t("cdash.completed_title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {ticketsQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Completed jobs could not be loaded" : "Abgeschlossene Auftraege konnten nicht geladen werden"}
            description={lang === "EN" ? "The backend request failed. This is different from an empty demo database." : "Die Backend-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine leere Demo-Datenbank."}
          />
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === "EN" ? "Total completed" : "Insgesamt erledigt", value: total, icon: Briefcase, color: "text-primary bg-primary/10" },
            { label: lang === "EN" ? "Avg. duration" : "Ø Dauer", value: `${avgHours} h`, icon: Clock, color: "text-info bg-info/10" },
            { label: lang === "EN" ? "Avg. rating" : "Ø Bewertung", value: avgRating, icon: Star, color: "text-warning bg-warning/10" },
            { label: lang === "EN" ? "On-time rate" : "Termintreue", value: `${onTime}%`, icon: CheckCircle2, color: "text-success bg-success/10" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${k.color}`}><k.icon className="h-4 w-4" /></div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">{lang === "EN" ? "Repair" : "Reparatur"}</div>
            <div className="col-span-2">{t("common.category")}</div>
            <div className="col-span-3">{t("common.property")}</div>
            <div className="col-span-1">{lang === "EN" ? "Duration" : "Dauer"}</div>
            <div className="col-span-1">{lang === "EN" ? "Rating" : "Bewertung"}</div>
            <div className="col-span-1 text-right">{lang === "EN" ? "Done" : "Erledigt"}</div>
          </div>
          {displayJobs.map((j) => (
            <div key={j.id} className="grid grid-cols-12 px-4 py-3 items-center border-b border-border last:border-b-0 hover:bg-accent/30">
              <div className="col-span-1 text-[11px] font-mono text-muted-foreground">{j.id}</div>
              <div className="col-span-3 min-w-0">
                <div className="text-sm font-semibold truncate">{j.title[lang]}</div>
                <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><User className="h-3 w-3" />{j.tenant}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">{j.category[lang]}</div>
              <div className="col-span-3 text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{j.property}</div>
              <div className="col-span-1 text-xs tabular-nums">{j.durationHours} h</div>
              <div className="col-span-1 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < j.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <div className="col-span-1 text-right text-[11px] text-muted-foreground">{j.completedAt[lang]}</div>
            </div>
          ))}
          {displayJobs.length === 0 && !ticketsQuery.isLoading && (
            <div className="p-8">
              <EmptyDataState
                title={lang === "EN" ? "No completed jobs" : "Keine abgeschlossenen Auftraege"}
                description={lang === "EN" ? "There are no resolved ticket records for this contractor. Reload mock data from the admin page to restore completed jobs." : "Es gibt keine erledigten Ticket-Datensaetze fuer diesen Handwerker. Lade Mock-Daten im Adminbereich neu, um abgeschlossene Auftraege wiederherzustellen."}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
