import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { insights, allContractors } from "@/lib/contractors";
import { tickets } from "@/lib/mockData";
import { useLang } from "@/lib/i18n";
import { Sparkles, AlertTriangle, TrendingDown, Bot, Clock, Flame, ArrowRight, Wrench } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights · Valta" },
      { name: "description", content: "Operational intelligence layer for property management — trends, bottlenecks and automation rate." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { t, lang } = useLang();
  const max = Math.max(...insights.volumeByCategory.map((c) => c.value));
  const responseMax = Math.max(...insights.responseTrend);

  return (
    <AppShell title={t("ins.title")} subtitle={t("ins.sub")}>
      <div className="p-4 md:p-8 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Headline label={t("ins.automation")} value={`${insights.automationRate}%`} delta={t("ins.automation.delta")} icon={Bot} tone="ai" />
          <Headline label={t("ins.resolution")} value={`${insights.avgResolutionHours} ${t("common.hours_short")}`} delta={t("ins.resolution.delta")} icon={Clock} tone="success" />
          <Headline label={t("ins.sla")} value={`${insights.slaBreaches}`} delta={t("ins.sla.delta")} icon={AlertTriangle} tone="destructive" />
          <Headline label={t("ins.hotspot")} value={lang === "EN" ? "Heating" : "Heizung"} delta={t("ins.hotspot.delta")} icon={Flame} tone="warning" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <header className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">{t("ins.response_per_week")}</h2>
                <p className="text-xs text-muted-foreground">{t("ins.response_sub")}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <TrendingDown className="h-3.5 w-3.5" /> {t("ins.trend_q1")}
              </span>
            </header>
            <div className="h-48 flex items-end gap-1.5">
              {insights.responseTrend.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/40 transition-all group-hover:from-ai group-hover:to-ai/40" style={{ height: `${(v / responseMax) * 100}%` }} />
                  <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <header className="mb-4">
              <h2 className="text-sm font-semibold">{t("ins.categories")}</h2>
              <p className="text-xs text-muted-foreground">{t("ins.categories_sub")}</p>
            </header>
            <ul className="space-y-2.5">
              {insights.volumeByCategory.map((c) => (
                <li key={c.label.DE}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{c.label[lang]}</span>
                    <span className="text-muted-foreground">{c.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${c.color} transition-all`} style={{ width: `${(c.value / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-border bg-surface shadow-soft">
            <header className="flex items-center gap-2 p-4 border-b border-border">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <h2 className="text-sm font-semibold">{t("ins.atrisk")}</h2>
                <p className="text-xs text-muted-foreground">{t("ins.atrisk_sub")}</p>
              </div>
            </header>
            <ul className="divide-y divide-border">
              {insights.atRisk.map((r) => (
                <li key={r.id} className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.id}</span>
                      <span className="rounded-full bg-destructive/10 text-destructive text-[11px] px-2 py-0.5 font-medium">{r.hours} {t("ins.atrisk_open")}</span>
                    </div>
                    <div className="text-sm font-medium mt-0.5">{r.title[lang]}</div>
                    <div className="text-xs text-muted-foreground">{r.reason[lang]}</div>
                  </div>
                  <Link to="/inbox" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                    {t("ins.atrisk_handle")} <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border ai-gradient p-5 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("ins.ai_panel")}
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight">{insights.automationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{t("ins.ai_panel_sub")}</p>
            <div className="mt-4 h-2 rounded-full bg-background overflow-hidden">
              <div className="h-full bg-ai transition-all" style={{ width: `${insights.automationRate}%` }} />
            </div>
            <ul className="mt-5 space-y-2 text-xs">
              <li className="flex justify-between"><span className="text-muted-foreground">{t("ins.auto_triage")}</span><span className="font-medium">92%</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">{t("ins.contractor_accepted")}</span><span className="font-medium">81%</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">{t("ins.translations")}</span><span className="font-medium">100%</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">{t("ins.duplicates")}</span><span className="font-medium">14</span></li>
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{t("ins.top_performer")}</h2>
              <p className="text-xs text-muted-foreground">{t("ins.top_performer_sub")}</p>
            </div>
            <Link to="/contractors" className="text-xs text-primary hover:underline">{t("act.view_all")} →</Link>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allContractors.filter((c) => c.topMatch).slice(0, 6).map((c) => (
              <Link key={c.id} to="/contractors/$id" params={{ id: c.id }} className="rounded-xl border border-border bg-background p-3 flex items-center gap-3 hover:bg-accent transition-colors">
                <div className="h-9 w-9 rounded-md bg-accent flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">★ {c.rating} · {c.reviews} · {c.city}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-success/15 text-success-foreground rounded px-1.5 py-0.5">{t("common.eta")} {c.etaHours}{t("common.hours_short")}</span>
              </Link>
            ))}
          </div>
        </section>

        <p className="text-[11px] text-muted-foreground">{t("ins.demo_note").replace("{n}", String(tickets.length))}</p>
      </div>
    </AppShell>
  );
}

function Headline({ label, value, delta, icon: Icon, tone }: { label: string; value: string; delta: string; icon: typeof Sparkles; tone: "ai" | "success" | "destructive" | "warning" }) {
  const cls =
    tone === "ai" ? "text-ai" :
    tone === "success" ? "text-success" :
    tone === "destructive" ? "text-destructive" : "text-warning";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${cls}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>
    </div>
  );
}
