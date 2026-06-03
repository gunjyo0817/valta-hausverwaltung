import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { StatusBadge, UrgencyBadge } from "@/components/Badges";
import { AlertOctagon, Clock, Building2 } from "lucide-react";
import { useState } from "react";
import { useTickets } from "@/lib/api";

export const Route = createFileRoute("/owner/issues")({ component: OwnerIssues });

const etaByUrgency: Record<string, { DE: string; EN: string }> = {
  critical: { DE: "Innerhalb 4 Std.", EN: "Within 4 h" },
  high: { DE: "Innerhalb 24 Std.", EN: "Within 24 h" },
  medium: { DE: "2–3 Werktage", EN: "2–3 business days" },
  low: { DE: "Nächste Wartung", EN: "Next maintenance" },
};

function OwnerIssues() {
  const { t, lang } = useLang();
  const ticketsQuery = useTickets();
  const ticketData = ticketsQuery.data;
  const tickets = ticketData ?? [];
  const open = tickets.filter((tk) => tk.status !== "resolved");
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const filtered = filter === "all" ? open : open.filter((tk) => tk.urgency === filter);

  const counts = {
    all: open.length,
    critical: open.filter((tk) => tk.urgency === "critical").length,
    high: open.filter((tk) => tk.urgency === "high").length,
    medium: open.filter((tk) => tk.urgency === "medium").length,
  };

  return (
    <AppShell title={t("odash.issues_title")} subtitle={t("odash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {ticketsQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Owner issues could not be loaded" : "Eigentuemer-Faelle konnten nicht geladen werden"}
            description={lang === "EN" ? "The ticket read failed. This is different from an intentionally empty demo database." : "Die Ticket-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich geleerte Demo-Datenbank."}
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ["all", lang === "EN" ? "Open total" : "Offen gesamt", "text-primary bg-primary/10"],
            ["critical", t("urgency.critical"), "text-destructive bg-destructive/10"],
            ["high", t("urgency.high"), "text-warning bg-warning/10"],
            ["medium", t("urgency.medium"), "text-info bg-info/10"],
          ] as const).map(([k, label, color]) => (
            <button key={k} onClick={() => setFilter(k as any)} className={`text-left rounded-xl border bg-surface p-4 transition-colors ${filter === k ? "border-primary" : "border-border hover:border-primary/40"}`}>
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${color}`}><AlertOctagon className="h-4 w-4" /></div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{counts[k]}</div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="hidden md:grid grid-cols-12 px-4 py-2.5 bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">{t("common.summary")}</div>
            <div className="col-span-2">{t("common.category")}</div>
            <div className="col-span-3">{t("common.property")}</div>
            <div className="col-span-1">{t("common.status")}</div>
            <div className="col-span-1">{t("common.priority")}</div>
            <div className="col-span-1 text-right">{lang === "EN" ? "Est. resolution" : "Vorauss. Lösung"}</div>
          </div>
          {filtered.map((tk) => (
            <Link key={tk.id} to="/ticket/$id" params={{ id: tk.id }} className="block border-b border-border last:border-b-0 hover:bg-accent/30">
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-12 px-4 py-3 items-center">
                <div className="col-span-1 text-[11px] font-mono text-muted-foreground">{tk.id}</div>
                <div className="col-span-3 min-w-0">
                  <div className="text-sm font-semibold truncate">{tk.title[lang]}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{tk.createdAt[lang]} · {tk.contractorName ?? "—"}</div>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">{tk.category[lang]}</div>
                <div className="col-span-3 text-xs text-muted-foreground truncate flex items-center gap-1"><Building2 className="h-3 w-3" />{tk.tenant.building}</div>
                <div className="col-span-1"><StatusBadge status={tk.status} /></div>
                <div className="col-span-1"><UrgencyBadge urgency={tk.urgency} /></div>
                <div className="col-span-1 text-right text-[11px] text-muted-foreground inline-flex items-center justify-end gap-1"><Clock className="h-3 w-3" />{etaByUrgency[tk.urgency][lang]}</div>
              </div>
              {/* Mobile card */}
              <div className="md:hidden p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-mono text-muted-foreground">{tk.id}</div>
                    <div className="text-sm font-semibold mt-0.5">{tk.title[lang]}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate"><Building2 className="h-3 w-3 shrink-0" />{tk.tenant.building}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={tk.status} />
                  <UrgencyBadge urgency={tk.urgency} />
                  <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{tk.category[lang]}</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{etaByUrgency[tk.urgency][lang]}</div>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="p-8">
              {open.length === 0 && !ticketsQuery.isLoading ? (
                <EmptyDataState
                  title={lang === "EN" ? "No open owner issues" : "Keine offenen Eigentuemer-Faelle"}
                  description={lang === "EN" ? "There are no open ticket records. Reload mock data from the admin page to restore owner issue rows." : "Es gibt keine offenen Ticket-Datensaetze. Lade Mock-Daten im Adminbereich neu, um Eigentuemer-Faelle wiederherzustellen."}
                />
              ) : (
                <div className="text-center text-sm text-muted-foreground">{t("common.no_results")}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
