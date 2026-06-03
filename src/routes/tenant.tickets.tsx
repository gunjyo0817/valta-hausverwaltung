import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { StatusBadge } from "@/components/Badges";
import { ArrowRight, MessageSquareText, Camera } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTickets } from "@/lib/api";
import { isDemoTenantTicket } from "@/lib/tenant-demo";

export const Route = createFileRoute("/tenant/tickets")({
  head: () => ({
    meta: [
      { title: "My requests · Valta" },
      { name: "description", content: "All your maintenance requests." },
    ],
  }),
  component: TenantTickets,
});

function TenantTickets() {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const ticketsQuery = useTickets();
  const tickets = ticketsQuery.data ?? [];
  const mine = tickets.filter(isDemoTenantTicket);
  const filtered = mine.filter((tk) =>
    filter === "all" ? true : filter === "resolved" ? tk.status === "resolved" : tk.status !== "resolved",
  );

  const tabs: Array<{ id: typeof filter; label: string; count: number }> = [
    { id: "all", label: lang === "EN" ? "All" : "Alle", count: mine.length },
    { id: "active", label: lang === "EN" ? "Active" : "Aktiv", count: mine.filter((t) => t.status !== "resolved").length },
    { id: "resolved", label: lang === "EN" ? "Resolved" : "Erledigt", count: mine.filter((t) => t.status === "resolved").length },
  ];

  return (
    <AppShell
      title={lang === "EN" ? "My requests" : "Meine Anfragen"}
      subtitle={lang === "EN" ? "Track every request in one place" : "Alle Anfragen an einem Ort"}
      actions={
        <Link to="/tenant/new-request" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">
          <MessageSquareText className="h-3.5 w-3.5" /> {lang === "EN" ? "New request" : "Neue Anfrage"}
        </Link>
      }
    >
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
        {ticketsQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Requests could not be loaded" : "Anfragen konnten nicht geladen werden"}
            description={lang === "EN" ? "The tenant request read failed. This is different from an empty demo database." : "Die Abfrage der Mieteranfragen ist fehlgeschlagen. Das ist etwas anderes als eine leere Demo-Datenbank."}
          />
        )}
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition",
                filter === tab.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-accent",
              )}
            >
              {tab.label}
              <span className={cn("rounded-full px-1.5 text-[10px] font-semibold", filter === tab.id ? "bg-primary-foreground/20" : "bg-muted")}>{tab.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          mine.length === 0 && !ticketsQuery.isLoading ? (
            <EmptyDataState
              title={lang === "EN" ? "No tenant requests" : "Keine Mieteranfragen"}
              description={lang === "EN" ? "The demo database has no tenant ticket records. Reload mock data from the admin page to restore the tenant timeline." : "Die Demo-Datenbank enthaelt keine Mieter-Tickets. Lade Mock-Daten im Adminbereich neu, um die Mieter-Timeline wiederherzustellen."}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
              {lang === "EN" ? "No requests in this view." : "Keine Anfragen in dieser Ansicht."}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {filtered.map((tk) => (
              <Link
                key={tk.id}
                to="/tenant/tickets/$id"
                params={{ id: tk.id }}
                className="block rounded-xl border border-border bg-surface p-4 hover:border-primary/40 hover:shadow-soft transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-muted-foreground">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{tk.title[lang]}</div>
                        <div className="text-[11px] text-muted-foreground">{tk.id} · {tk.createdAt[lang]} · {tk.category[lang]}</div>
                      </div>
                      <StatusBadge status={tk.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{tk.summary[lang]}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{tk.contractorName ?? "—"}</span>
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        {lang === "EN" ? "Track" : "Verfolgen"} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
