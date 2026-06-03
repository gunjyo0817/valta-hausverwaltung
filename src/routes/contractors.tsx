import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { useContractors, type ContractorDto } from "@/lib/api";
import { Search, Wrench, Star, ArrowUpRight, Filter, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contractors")({
  head: () => ({
    meta: [
      { title: "Contractors · Valta" },
      { name: "description", content: "Contractor directory: specialties, availability and AI-matched recommendations." },
    ],
  }),
  component: ContractorsPage,
});

const specialtyKeys = ["Heating", "Plumber", "Electrician", "Elevator", "Internet", "Cleaning", "Mold", "Emergency"];

function specialtyLabel(k: string, lang: "DE" | "EN") {
  const map: Record<string, { DE: string; EN: string }> = {
    Heating: { DE: "Heizung", EN: "Heating technician" },
    Plumber: { DE: "Klempner", EN: "Plumber" },
    Electrician: { DE: "Elektriker", EN: "Electrician" },
    Elevator: { DE: "Aufzug-Service", EN: "Elevator service" },
    Internet: { DE: "Internet-Provider", EN: "Internet provider" },
    Cleaning: { DE: "Reinigung", EN: "Cleaning service" },
    Mold: { DE: "Gutachter", EN: "Surveyor" },
    Emergency: { DE: "Notfall", EN: "Emergency repair" },
  };
  return map[k]?.[lang] ?? k;
}

function ContractorsPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/contractors" && pathname.startsWith("/contractors/")) return <Outlet />;

  return <ContractorsListPage />;
}

function ContractorsListPage() {
  const { t, lang } = useLang();

  const [query, setQuery] = useState("");
  const [spec, setSpec] = useState<string>("all");
  const [avail, setAvail] = useState<"all" | "available" | "unavailable">("all");
  const allContractorsQuery = useContractors();
  const contractorsQuery = useContractors({ query, specialtyKey: spec, availability: avail });
  const allContractors = allContractorsQuery.data ?? [];
  const filtered = contractorsQuery.data ?? [];

  return (
    <AppShell title={t("ctr.title")} subtitle={t("ctr.sub").replace("{n}", String(allContractors.length))}>
      <div className="p-4 md:p-8 space-y-6">
        {(contractorsQuery.isError || allContractorsQuery.isError) && (
          <DataErrorState
            title={lang === "EN" ? "Contractors could not be loaded" : "Handwerker konnten nicht geladen werden"}
            description={lang === "EN" ? "The contractor directory request failed. This is different from an intentionally empty demo database." : "Die Handwerker-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich geleerte Demo-Datenbank."}
          />
        )}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search_contractors")} className="w-full bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={spec} onChange={(e) => setSpec(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5">
              <option value="all">{t("common.all")} · {t("ctr.filter_specialty")}</option>
              {specialtyKeys.map((k) => <option key={k} value={k}>{specialtyLabel(k, lang)}</option>)}
            </select>
            <select value={avail} onChange={(e) => setAvail(e.target.value as "all" | "available" | "unavailable")} className="rounded-md border border-border bg-surface px-2 py-1.5">
              <option value="all">{t("common.all")} · {t("ctr.filter_availability")}</option>
              <option value="available">{t("common.available")}</option>
              <option value="unavailable">{t("common.unavailable")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <ContractorCard key={c.id} c={c} />
          ))}
        </div>

        {filtered.length === 0 && (
          allContractors.length === 0 && !contractorsQuery.isLoading ? (
            <EmptyDataState
              title={lang === "EN" ? "No contractors in the database" : "Keine Handwerker in der Datenbank"}
              description={lang === "EN" ? "The demo contractor records have been cleared. Reload mock data from the admin page to restore the directory." : "Die Demo-Handwerker wurden geleert. Lade Mock-Daten im Adminbereich neu, um das Verzeichnis wiederherzustellen."}
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

function ContractorCard({ c }: { c: ContractorDto }) {
  const { t, lang } = useLang();
  return (
    <Link to="/contractors/$id" params={{ id: c.id }} className="rounded-xl border border-border bg-surface p-4 shadow-soft hover:shadow-card hover:border-primary/30 transition-all group">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
          <Wrench className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{c.name}</h3>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-xs text-muted-foreground truncate">{c.specialty[lang]}</div>
        </div>
        {c.preferred && <span className="text-[10px] uppercase tracking-wider bg-ai/10 text-ai rounded px-1.5 py-0.5 inline-flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />{t("common.preferred")}</span>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{c.rating}</span>
        <span className="text-muted-foreground">({c.reviews})</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.city}</span>
        <span className="text-muted-foreground">·</span>
        <span className={cn("rounded px-1.5 py-0.5", c.available ? "bg-success/15 text-success-foreground" : "bg-muted text-muted-foreground")}>
          {c.available ? `${t("common.available")} · ${t("common.eta")} ${c.etaHours}${t("common.hours_short")}` : t("common.unavailable")}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div>{t("common.active_jobs")}: <span className="text-foreground font-medium">{c.activeJobs}</span></div>
        <div>{t("common.reliability")}: <span className="text-foreground font-medium">{c.reliability}%</span></div>
      </div>
    </Link>
  );
}
