import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import { tickets, kpis, aiActivity, notifications } from "@/lib/mockData";
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
      { name: "description", content: "Operations Copilot für Hausverwaltungen – KPIs, aktive Tickets und AI-Aktivität auf einen Blick." },
    ],
  }),
  component: Dashboard,
});

const kpiCards = [
  { label: "Offene Tickets", value: kpis.openTickets, delta: "+3 heute", icon: Inbox, tone: "primary" as const },
  { label: "Ø Reaktionszeit", value: `${kpis.avgResponseMin} Min.`, delta: "−38% MoM", icon: Timer, tone: "success" as const },
  { label: "AI-Vorschläge übernommen", value: `${kpis.aiResolved}`, delta: "diese Woche", icon: Sparkles, tone: "ai" as const },
  { label: "Kritische Fälle", value: kpis.urgent, delta: "Sofort prüfen", icon: AlertTriangle, tone: "destructive" as const },
  { label: "Wartet auf Handwerker", value: kpis.pendingContractor, delta: "2 überfällig", icon: Wrench, tone: "warning" as const },
];

function Dashboard() {
  return (
    <AppShell
      title="Guten Morgen, Sarah"
      subtitle="Hier ist, was in Ihrem Portfolio heute Aufmerksamkeit braucht."
    >
      <div className="p-4 md:p-8 space-y-6">
        {/* KPI grid */}
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
          {/* Active tickets */}
          <section className="xl:col-span-2 rounded-xl border border-border bg-surface shadow-soft">
            <header className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold">Aktive Tickets</h2>
                <p className="text-xs text-muted-foreground">Sortiert nach Dringlichkeit – Copilot triagiert in Echtzeit.</p>
              </div>
              <Link to="/inbox" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                Inbox öffnen <ArrowRight className="h-3 w-3" />
              </Link>
            </header>
            <ul className="divide-y divide-border">
              {tickets.filter((t) => t.status !== "resolved").map((t) => (
                <li key={t.id}>
                  <Link
                    to="/ticket/$id"
                    params={{ id: t.id }}
                    className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t.id}</span>
                        <UrgencyBadge urgency={t.urgency} />
                        <AIBadge confidence={t.confidence} />
                      </div>
                      <div className="mt-1 truncate text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.tenant.name} · {t.tenant.apartment} · {t.tenant.building}
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1">
                      <StatusBadge status={t.status} />
                      <span className="text-[11px] text-muted-foreground">{t.createdAt}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Right column */}
          <section className="space-y-6">
            <div className="rounded-xl border border-border bg-surface shadow-soft">
              <header className="flex items-center gap-2 p-4 border-b border-border">
                <Sparkles className="h-4 w-4 text-ai" />
                <h2 className="text-sm font-semibold">AI Assistant · Aktivität</h2>
              </header>
              <ul className="p-4 space-y-3">
                {aiActivity.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-ai/70" />
                    <div className="min-w-0">
                      <div className="text-sm leading-snug">{a.text}</div>
                      <div className="text-[11px] text-muted-foreground">{a.at}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface shadow-soft">
              <header className="flex items-center gap-2 p-4 border-b border-border">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Benachrichtigungen</h2>
              </header>
              <ul className="p-4 space-y-3">
                {notifications.map((n, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 text-[11px] text-muted-foreground">{n.at}</span>
                    <span className="leading-snug">{n.text}</span>
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
