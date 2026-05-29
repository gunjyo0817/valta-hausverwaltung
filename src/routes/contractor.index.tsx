import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { UrgencyBadge, StatusBadge } from "@/components/Badges";
import { MapPin, Phone, Camera, CheckCircle2, MessageSquareText, Wrench, Clock, Star, Briefcase } from "lucide-react";

export const Route = createFileRoute("/contractor/")({ component: ContractorJobs });

function ContractorJobs() {
  const { t, lang } = useLang();
  // contractor = Müller Heizung (c1) → jobs assigned to them; fall back to a few open jobs
  const jobs = tickets.filter((tk) => tk.contractorId === "c1" || tk.urgency === "critical" || tk.urgency === "high").filter((tk) => tk.status !== "resolved");

  const kpi = [
    { label: t("cdash.kpi_active"), value: jobs.length, icon: Briefcase, color: "text-primary bg-primary/10" },
    { label: t("cdash.kpi_week"), value: 5, icon: Clock, color: "text-info bg-info/10" },
    { label: t("cdash.kpi_avg"), value: "2.1h", icon: Wrench, color: "text-warning bg-warning/10" },
    { label: t("cdash.kpi_rating"), value: "4.9", icon: Star, color: "text-success bg-success/10" },
  ];

  return (
    <AppShell title={t("cdash.title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpi.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${k.color}`}><k.icon className="h-4 w-4" /></div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Jobs list */}
        <div className="space-y-3">
          {jobs.map((tk) => (
            <div key={tk.id} className="rounded-xl border border-border bg-surface overflow-hidden hover:shadow-soft transition-shadow">
              <div className="p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-muted-foreground">{tk.id}</span>
                      <UrgencyBadge urgency={tk.urgency} />
                      <StatusBadge status={tk.status} />
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold tracking-tight">{tk.title[lang]}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {tk.tenant.building} · {tk.tenant.apartment[lang]}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("cdash.eta")}</div>
                    <div className="text-sm font-semibold">Heute · 14:00</div>
                  </div>
                </div>

                <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border bg-accent/20 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("cdash.notes")}</div>
                    <p className="text-foreground">{tk.summary[lang]}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-accent/20 p-3 space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("cdash.tenant_contact")}</div>
                    <div className="font-medium text-foreground">{tk.tenant.name}</div>
                    <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {tk.tenant.phone}</div>
                    {tk.photos > 0 && <div className="flex items-center gap-1 text-muted-foreground"><Camera className="h-3 w-3" /> {tk.photos} {t("common.photos")}</div>}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("cdash.accept")}
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition">
                    <Wrench className="h-3.5 w-3.5" /> {t("cdash.start")}
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition">
                    <MessageSquareText className="h-3.5 w-3.5" /> {t("cdash.request_info")}
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition ml-auto">
                    <MapPin className="h-3.5 w-3.5" /> {t("cdash.directions")}
                  </button>
                  <Link to="/ticket/$id" params={{ id: tk.id }} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition">
                    {t("act.open_ticket")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
