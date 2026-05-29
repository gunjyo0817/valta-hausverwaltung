import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { properties } from "@/lib/properties";
import { tickets } from "@/lib/mockData";
import { Building2, AlertOctagon, ShieldCheck, Wallet, Sparkles, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/owner/")({ component: OwnerHome });

function OwnerHome() {
  const { t, lang } = useLang();
  const openCases = tickets.filter((tk) => tk.status !== "resolved").length;
  const totalUnits = properties.reduce((s, p) => s + p.units, 0);

  const kpi = [
    { label: t("odash.kpi_units"), value: totalUnits, sub: `${properties.length} ${t("common.properties")}`, icon: Building2, color: "text-primary bg-primary/10" },
    { label: t("odash.kpi_open"), value: openCases, sub: t("common.critical"), icon: AlertOctagon, color: "text-destructive bg-destructive/10" },
    { label: t("odash.kpi_approvals"), value: 2, sub: "—", icon: ShieldCheck, color: "text-warning bg-warning/10" },
    { label: t("odash.kpi_costs"), value: "€ 48.230", sub: "−12% YoY", icon: Wallet, color: "text-success bg-success/10" },
  ];

  const approvals = [
    { id: "AP-104", title: { DE: "Heizungsanlage Lindenstr. 22 – Tausch", EN: "Heating system Lindenstr. 22 — replacement" }, amount: "€ 12.400", urgency: "high", reason: { DE: "3 wiederkehrende Ausfälle in 30 Tagen.", EN: "3 recurring failures in 30 days." } },
    { id: "AP-103", title: { DE: "Dachsanierung Parkallee 110", EN: "Roof repair Parkallee 110" }, amount: "€ 8.900", urgency: "medium", reason: { DE: "Angebot von Dachdecker Hansen vorliegend.", EN: "Quote from roofer Hansen available." } },
  ];

  return (
    <AppShell title={t("odash.title")} subtitle={t("odash.sub")}>
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
              <div className="text-[11px] text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-ai/10 via-accent/30 to-surface p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-ai/15 text-ai flex items-center justify-center"><Sparkles className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t("odash.summary")}</div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t("odash.summary_text")}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Building health */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">{t("odash.health")}</h3>
              <Link to="/owner/issues" className="text-xs text-primary hover:underline inline-flex items-center gap-1">{t("onav.issues")} <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{t("odash.health_sub")}</p>
            <div className="space-y-2">
              {properties.slice(0, 4).map((p) => {
                const open = tickets.filter((tk) => tk.propertyId === p.id && tk.status !== "resolved").length;
                const health = open === 0 ? "healthy" : open >= 2 ? "urgent" : "attention";
                const color = health === "healthy" ? "bg-success" : health === "urgent" ? "bg-destructive" : "bg-warning";
                return (
                  <Link to="/properties/$id" params={{ id: p.id }} key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors">
                    <div className={`h-2 w-2 rounded-full ${color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.city} · {p.units} {t("prop.units")}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{open} {t("common.open_tickets")}</div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Approvals */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold">{t("odash.approvals_title")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("odash.approvals_sub")}</p>
            <div className="space-y-3">
              {approvals.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium leading-snug">{a.title[lang]}</div>
                    <div className="text-sm font-semibold shrink-0">{a.amount}</div>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{a.reason[lang]}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition">{t("odash.approve")}</button>
                    <button className="flex-1 inline-flex items-center justify-center rounded-md border border-border bg-surface px-2 py-1.5 text-[11px] hover:bg-accent transition">{t("odash.reject")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold mb-3">{t("odash.cost_breakdown")}</h3>
          <div className="space-y-2.5">
            {[
              { label: { DE: "Heizung", EN: "Heating" }, value: 38, amount: "€ 18.320" },
              { label: { DE: "Wasser/Sanitär", EN: "Plumbing" }, value: 24, amount: "€ 11.580" },
              { label: { DE: "Elektrik", EN: "Electrical" }, value: 16, amount: "€ 7.720" },
              { label: { DE: "Aufzug", EN: "Elevator" }, value: 12, amount: "€ 5.790" },
              { label: { DE: "Sonstiges", EN: "Other" }, value: 10, amount: "€ 4.820" },
            ].map((c) => (
              <div key={c.amount} className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground w-24 shrink-0">{c.label[lang]}</div>
                <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${c.value * 2}%` }} />
                </div>
                <div className="text-xs font-medium w-20 text-right tabular-nums">{c.amount}</div>
                <div className="text-[10px] text-success flex items-center gap-0.5 w-10 justify-end"><TrendingDown className="h-2.5 w-2.5" />−{Math.round(c.value / 3)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
