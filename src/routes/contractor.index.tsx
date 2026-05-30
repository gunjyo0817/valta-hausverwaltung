import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets as mockTickets } from "@/lib/mockData";
import { UrgencyBadge, StatusBadge } from "@/components/Badges";
import { MapPin, Phone, Camera, CheckCircle2, MessageSquareText, Wrench, Clock, Star, Briefcase } from "lucide-react";
import { useTickets, useUpdateContractorJob } from "@/lib/api";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/contractor/")({ component: ContractorJobs });

function ContractorJobs() {
  const { t, lang } = useLang();
  const { data } = useTickets();
  const updateJob = useUpdateContractorJob();
  const tickets = data && data.length > 0 ? data : mockTickets;
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const jobs = useMemo(
    () => tickets.filter((tk) => tk.contractorId === "c1" && tk.status !== "resolved"),
    [tickets],
  );

  const act = async (ticketId: string, action: "accept" | "start" | "request_info" | "complete") => {
    const message = action === "request_info"
      ? (lang === "EN" ? "Please confirm access details and any special instructions." : "Bitte Zugangsdaten und besondere Hinweise bestätigen.")
      : undefined;
    const key = `${ticketId}:${action}`;
    setActiveAction(key);
    try {
      await updateJob.mutateAsync({ data: { ticketId, action, message, role: "contractor" } });
    } catch (error) {
      console.error("Contractor job action failed", error);
    } finally {
      setActiveAction(null);
    }
  };
  const isActing = (ticketId: string, action: string) => activeAction === `${ticketId}:${action}` && updateJob.isPending;

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
                  <button onClick={() => void act(tk.id, "accept")} disabled={updateJob.isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {isActing(tk.id, "accept") ? t("common.loading") : t("cdash.accept")}
                  </button>
                  <button onClick={() => void act(tk.id, "start")} disabled={updateJob.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition disabled:opacity-50">
                    <Wrench className="h-3.5 w-3.5" /> {isActing(tk.id, "start") ? t("common.loading") : t("cdash.start")}
                  </button>
                  <button onClick={() => void act(tk.id, "request_info")} disabled={updateJob.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition disabled:opacity-50">
                    <MessageSquareText className="h-3.5 w-3.5" /> {isActing(tk.id, "request_info") ? t("common.loading") : t("cdash.request_info")}
                  </button>
                  <button onClick={() => void act(tk.id, "complete")} disabled={updateJob.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition disabled:opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {isActing(tk.id, "complete") ? t("common.loading") : (lang === "EN" ? "Complete" : "Abschließen")}
                  </button>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(tk.tenant.building)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition ml-auto">
                    <MapPin className="h-3.5 w-3.5" /> {t("cdash.directions")}
                  </a>
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
