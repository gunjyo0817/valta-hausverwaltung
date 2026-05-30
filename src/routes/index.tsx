import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import {
  tickets as mockTickets,
  kpis as mockKpis,
  aiActivity as mockAiActivity,
  notifications as mockNotifications,
} from "@/lib/mockData";
import { useLang } from "@/lib/i18n";
import { useDashboardData } from "@/lib/api";
import {
  Inbox,
  Timer,
  Sparkles,
  AlertTriangle,
  Wrench,
  ArrowUpRight,
  ArrowRight,
  Bell,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Valta" },
      { name: "description", content: "Operations Copilot for property management — KPIs, active tickets, and AI activity at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useLang();
  const { data } = useDashboardData();
  const kpis = data?.kpis ?? mockKpis;
  const tickets = data?.activeTickets ?? mockTickets;
  const aiActivity = data?.aiActivity ?? mockAiActivity;
  const notifications =
    data?.notifications.map((notification) => ({
      at: notification.time[lang],
      text: notification.title,
    })) ?? mockNotifications;
  const kpiCards = [
    { label: t("kpi.open"), value: kpis.openTickets, delta: t("kpi.open.delta"), icon: Inbox, tone: "primary" as const },
    { label: t("kpi.response"), value: `${kpis.avgResponseMin} ${t("common.minutes_short")}`, delta: t("kpi.response.delta"), icon: Timer, tone: "success" as const },
    { label: t("kpi.ai"), value: `${kpis.aiResolved}`, delta: t("kpi.ai.delta"), icon: Sparkles, tone: "ai" as const },
    { label: t("kpi.urgent"), value: kpis.urgent, delta: t("kpi.urgent.delta"), icon: AlertTriangle, tone: "destructive" as const },
    { label: t("kpi.pending"), value: kpis.pendingContractor, delta: t("kpi.pending.delta"), icon: Wrench, tone: "warning" as const },
  ];

  return (
    <AppShell title={t("dash.greeting")} subtitle={t("dash.sub")}>
      <div className="p-4 md:p-8 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {kpiCards.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4 shadow-soft hover:shadow-card transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${
                  k.tone === "primary" ? "text-primary" :
                  k.tone === "success" ? "text-success" :
                  k.tone === "ai" ? "text-ai" :
                  k.tone === "destructive" ? "text-destructive" : "text-warning"
                }`} />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</div>
              <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {k.delta}
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 rounded-xl border border-border bg-surface shadow-soft">
            <header className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold">{t("section.active")}</h2>
                <p className="text-xs text-muted-foreground">{t("section.active.sub")}</p>
              </div>
              <Link to="/inbox" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                {t("section.open_inbox")} <ArrowRight className="h-3 w-3" />
              </Link>
            </header>
            <ul className="divide-y divide-border">
              {tickets.filter((tk) => tk.status !== "resolved").map((tk) => (
                <li key={tk.id}>
                  <Link
                    to="/ticket/$id"
                    params={{ id: tk.id }}
                    className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{tk.id}</span>
                        <UrgencyBadge urgency={tk.urgency} />
                        <AIBadge confidence={tk.confidence} />
                      </div>
                      <div className="mt-1 truncate text-sm font-medium">{tk.title[lang]}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {tk.tenant.name} · {tk.tenant.apartment[lang]} · {tk.tenant.building}
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1">
                      <StatusBadge status={tk.status} />
                      <span className="text-[11px] text-muted-foreground">{tk.createdAt[lang]}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-6">
            <div className="rounded-xl border border-border bg-surface shadow-soft">
              <header className="flex items-center gap-2 p-4 border-b border-border">
                <Sparkles className="h-4 w-4 text-ai" />
                <h2 className="text-sm font-semibold">{t("section.ai_activity")}</h2>
              </header>
              <ul className="p-4 space-y-3">
                {aiActivity.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-ai/70" />
                    <div className="min-w-0">
                      <div className="text-sm leading-snug">{a.text[lang]}</div>
                      <div className="text-[11px] text-muted-foreground">{a.at[lang]}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface shadow-soft">
              <header className="flex items-center gap-2 p-4 border-b border-border">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">{t("section.notifications")}</h2>
              </header>
              <ul className="p-4 space-y-3">
                {notifications.map((n, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 text-[11px] text-muted-foreground">{n.at}</span>
                    <span className="leading-snug">{n.text[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
