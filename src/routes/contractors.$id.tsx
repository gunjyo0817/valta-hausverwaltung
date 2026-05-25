import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getContractor } from "@/lib/contractors";
import { tickets } from "@/lib/mockData";
import { useLang } from "@/lib/i18n";
import { StatusBadge, UrgencyBadge } from "@/components/Badges";
import { ArrowLeft, Wrench, Star, MapPin, Phone, Mail, Sparkles, ChevronRight, ArrowUpRight, ShieldCheck, Clock } from "lucide-react";

export const Route = createFileRoute("/contractors/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Valta` },
      { name: "description", content: "Contractor profile with service areas, jobs and reliability score." },
    ],
  }),
  component: ContractorDetail,
});

function ContractorDetail() {
  const { id } = useParams({ from: "/contractors/$id" });
  const c = getContractor(id);
  const { t, lang } = useLang();
  const active = tickets.filter((tk) => tk.contractorId === c.id && tk.status !== "resolved");
  const past = tickets.filter((tk) => tk.contractorId === c.id && tk.status === "resolved");

  return (
    <AppShell title={c.name} subtitle={c.specialty[lang]}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/contractors" className="hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" />{t("act.back_to_contractors")}</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{c.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">{c.name}</h2>
                    {c.preferred && <span className="text-[10px] uppercase tracking-wider bg-ai/10 text-ai rounded px-1.5 py-0.5 inline-flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />{t("common.preferred")}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{c.specialty[lang]}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{c.rating} ({c.reviews})</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.city}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className={c.available ? "text-success" : "text-muted-foreground"}>
                      {c.available ? `${t("common.available")} · ${t("common.eta")} ${c.etaHours}${t("common.hours_short")}` : t("common.unavailable")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label={t("common.active_jobs")} value={String(c.activeJobs)} />
                <Stat label={t("common.past_jobs")} value={String(c.pastJobs)} />
                <Stat label={t("common.avg_completion")} value={`${c.avgCompletionHours} ${t("common.hours_short")}`} />
                <Stat label={t("common.reliability")} value={`${c.reliability}%`} />
              </div>

              <div className="mt-5 rounded-xl ai-gradient p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("common.ai_recommendation")}
                </div>
                <p className="mt-2 text-sm leading-relaxed">{c.aiReason[lang]}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface shadow-soft">
              <header className="flex items-center gap-2 p-4 border-b border-border">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("common.active_jobs")}</h3>
              </header>
              <ul className="divide-y divide-border">
                {active.length === 0 && <li className="p-6 text-xs text-muted-foreground text-center">{lang === "EN" ? "No active jobs right now." : "Aktuell keine aktiven Aufträge."}</li>}
                {active.map((tk) => (
                  <li key={tk.id}>
                    <Link to="/ticket/$id" params={{ id: tk.id }} className="flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center"><Wrench className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">{tk.id}</span>
                          <UrgencyBadge urgency={tk.urgency} />
                        </div>
                        <div className="text-sm font-medium truncate mt-0.5">{tk.title[lang]}</div>
                        <div className="text-xs text-muted-foreground truncate">{tk.tenant.building}</div>
                      </div>
                      <StatusBadge status={tk.status} />
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface shadow-soft">
              <header className="flex items-center gap-2 p-4 border-b border-border">
                <ShieldCheck className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold">{t("common.past_jobs")}</h3>
              </header>
              <ul className="divide-y divide-border">
                {past.length === 0 && <li className="p-6 text-xs text-muted-foreground text-center">{lang === "EN" ? "No completed jobs yet." : "Noch keine abgeschlossenen Aufträge."}</li>}
                {past.map((tk) => (
                  <li key={tk.id}>
                    <Link to="/ticket/$id" params={{ id: tk.id }} className="flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors text-sm">
                      <span className="text-[11px] text-muted-foreground w-16">{tk.id}</span>
                      <span className="flex-1 truncate">{tk.title[lang]}</span>
                      <StatusBadge status={tk.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <h3 className="text-sm font-semibold mb-3">{t("ctr.contact_info")}</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{c.phone}</span></li>
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{c.email}</span></li>
                <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{c.city}</span></li>
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><Phone className="h-3 w-3" />{t("act.call")}</button>
                <button className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent"><Mail className="h-3 w-3" />{t("act.email")}</button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <h3 className="text-sm font-semibold mb-3">{t("common.service_area")}</h3>
              <div className="flex flex-wrap gap-1.5">
                {c.serviceArea.map((s) => (
                  <span key={s} className="text-[11px] rounded-full bg-accent text-accent-foreground px-2 py-0.5">{s}</span>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">{t("ctr.ai_explain")}</div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}
