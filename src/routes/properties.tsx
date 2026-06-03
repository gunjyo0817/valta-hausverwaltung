import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { useProperties, useTickets, type PropertyDto } from "@/lib/api";
import { Search, Building2, AlertTriangle, MapPin, Users, Timer, Filter, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties")({
  head: () => ({
    meta: [
      { title: "Properties · Valta" },
      { name: "description", content: "Property portfolio overview for property management." },
    ],
  }),
  component: PropertiesPage,
});

function statusStyle(s: PropertyDto["status"]) {
  if (s === "urgent") return { cls: "bg-destructive/10 text-destructive", dot: "bg-destructive" };
  if (s === "attention") return { cls: "bg-warning/15 text-warning-foreground", dot: "bg-warning" };
  return { cls: "bg-success/15 text-success-foreground", dot: "bg-success" };
}

function PropertiesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/properties" && pathname.startsWith("/properties/")) return <Outlet />;

  return <PropertiesListPage />;
}

function PropertiesListPage() {
  const { t, lang } = useLang();

  const ticketsQuery = useTickets();
  const tickets = ticketsQuery.data ?? [];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PropertyDto["status"]>("all");
  const [city, setCity] = useState<string>("all");
  const allPropertiesQuery = useProperties();
  const propertiesQuery = useProperties({ query, status, city });
  const allProperties = allPropertiesQuery.data ?? [];
  const filtered = propertiesQuery.data ?? [];
  const cities = useMemo(() => Array.from(new Set(allProperties.map((p) => p.city))), [allProperties]);

  const statusLabel = (s: PropertyDto["status"]) => s === "urgent" ? t("common.urgent") : s === "attention" ? t("common.attention") : t("common.healthy");

  return (
    <AppShell title={t("prop.title")} subtitle={t("prop.sub").replace("{n}", String(allProperties.length))}>
      <div className="p-4 md:p-8 space-y-6">
        {(propertiesQuery.isError || allPropertiesQuery.isError || ticketsQuery.isError) && (
          <DataErrorState
            title={lang === "EN" ? "Property data could not be loaded" : "Objektdaten konnten nicht geladen werden"}
            description={lang === "EN" ? "The backend read failed. This is separate from an empty demo database." : "Die Backend-Abfrage ist fehlgeschlagen. Das ist getrennt von einer leeren Demo-Datenbank."}
          />
        )}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search_properties")} className="w-full bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={status} onChange={(e) => setStatus(e.target.value as "all" | PropertyDto["status"])} className="rounded-md border border-border bg-surface px-2 py-1.5">
              <option value="all">{t("common.all")} · {t("prop.filter_status")}</option>
              <option value="healthy">{t("common.healthy")}</option>
              <option value="attention">{t("common.attention")}</option>
              <option value="urgent">{t("common.urgent")}</option>
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5">
              <option value="all">{t("common.all")} · {t("prop.filter_city")}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const s = statusStyle(p.status);
            const openTk = tickets.filter((tk) => tk.propertyId === p.id && tk.status !== "resolved").length;
            return (
              <Link key={p.id} to="/properties/$id" params={{ id: p.id }} className="rounded-xl border border-border bg-surface p-4 shadow-soft hover:shadow-card hover:border-primary/30 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}</div>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", s.cls)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                    {statusLabel(p.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <Cell icon={Users} label={t("prop.units")} value={String(p.units)} />
                <Cell icon={AlertTriangle} label={t("common.open_tickets")} value={String(openTk)} tone={openTk > 0 ? "warning" : undefined} />
                  <Cell icon={Timer} label={t("prop.avg_response")} value={`${p.avgResponseMin} ${t("common.minutes_short")}`} />
                </div>
                <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{t("prop.manager")}: <span className="text-foreground font-medium">{p.manager}</span></span>
                  {p.criticalTickets > 0 && <span className="text-destructive font-medium">{p.criticalTickets} {t("common.critical").toLowerCase()}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          allProperties.length === 0 && !allPropertiesQuery.isLoading ? (
            <EmptyDataState
              title={lang === "EN" ? "No properties in the database" : "Keine Objekte in der Datenbank"}
              description={lang === "EN" ? "The demo data has been cleared. Reload mock data from the admin page to restore properties, units, and documents." : "Die Demo-Daten wurden geleert. Lade Mock-Daten im Adminbereich neu, um Objekte, Einheiten und Dokumente wiederherzustellen."}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <div className="text-sm font-medium">{t("common.no_results")}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("common.empty_sub")}</div>
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}

function Cell({ icon: Icon, label, value, tone }: { icon: typeof Building2; label: string; value: string; tone?: "warning" }) {
  return (
    <div className="rounded-md bg-background border border-border p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn("text-sm font-semibold mt-0.5", tone === "warning" && "text-warning-foreground")}>{value}</div>
    </div>
  );
}
