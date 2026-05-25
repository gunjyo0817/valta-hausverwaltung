import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { insights, contractors } from "@/lib/contractors";
import { tickets } from "@/lib/mockData";
import { Sparkles, AlertTriangle, TrendingDown, Bot, Clock, Flame, ArrowRight, Wrench } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights · Valta" },
      { name: "description", content: "Operativer Intelligence-Layer für Hausverwaltungen – Trends, Engpässe und Automatisierungsrate." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const max = Math.max(...insights.volumeByCategory.map((c) => c.value));
  const responseMax = Math.max(...insights.responseTrend);

  return (
    <AppShell title="AI Insights" subtitle="Operativer Intelligence-Layer · letzte 90 Tage">
      <div className="p-4 md:p-8 space-y-6">
        {/* Headline KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Headline label="AI-Automatisierungsrate" value={`${insights.automationRate}%`} delta="+12% MoM" icon={Bot} tone="ai" />
          <Headline label="Ø Auflösungszeit" value={`${insights.avgResolutionHours} Std.`} delta="−9 Std. seit Einführung" icon={Clock} tone="success" />
          <Headline label="SLA-Verletzungen" value={`${insights.slaBreaches}`} delta="diese Woche" icon={AlertTriangle} tone="destructive" />
          <Headline label="Kritische Hotspots" value="Heizung" delta="34% aller Anfragen" icon={Flame} tone="warning" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Response trend */}
          <section className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <header className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Reaktionszeit pro Woche</h2>
                <p className="text-xs text-muted-foreground">Minuten zwischen Eingang und erster Antwort.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <TrendingDown className="h-3.5 w-3.5" /> −64% seit Q1
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

          {/* Category breakdown */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <header className="mb-4">
              <h2 className="text-sm font-semibold">Häufigste Kategorien</h2>
              <p className="text-xs text-muted-foreground">Anteil der Tickets pro Kategorie.</p>
            </header>
            <ul className="space-y-2.5">
              {insights.volumeByCategory.map((c) => (
                <li key={c.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{c.label}</span>
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
          {/* At risk */}
          <section className="lg:col-span-2 rounded-2xl border border-border bg-surface shadow-soft">
            <header className="flex items-center gap-2 p-4 border-b border-border">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <h2 className="text-sm font-semibold">Risiko-Tickets · brauchen Aufmerksamkeit</h2>
                <p className="text-xs text-muted-foreground">AI-erkannte Eskalations-Kandidaten.</p>
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
                      <span className="rounded-full bg-destructive/10 text-destructive text-[11px] px-2 py-0.5 font-medium">{r.hours} Std. offen</span>
                    </div>
                    <div className="text-sm font-medium mt-0.5">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.reason}</div>
                  </div>
                  <Link to="/inbox" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                    Bearbeiten <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* AI automation panel */}
          <section className="rounded-2xl border border-border ai-gradient p-5 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-ai" /> AI-Automatisierung
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight">{insights.automationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">der AI-Entwürfe wurden ohne Bearbeitung freigegeben.</p>
            <div className="mt-4 h-2 rounded-full bg-background overflow-hidden">
              <div className="h-full bg-ai transition-all" style={{ width: `${insights.automationRate}%` }} />
            </div>
            <ul className="mt-5 space-y-2 text-xs">
              <li className="flex justify-between"><span className="text-muted-foreground">Auto-Triage</span><span className="font-medium">92%</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Handwerker-Vorschlag akzeptiert</span><span className="font-medium">81%</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Übersetzungen</span><span className="font-medium">100%</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Duplikate erkannt</span><span className="font-medium">14</span></li>
            </ul>
          </section>
        </div>

        {/* Contractor performance */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Handwerker-Netzwerk · Top-Performer</h2>
              <p className="text-xs text-muted-foreground">Nach Reaktionszeit und Mieter-Zufriedenheit.</p>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(contractors).flat().filter((c) => c.topMatch).slice(0, 6).map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-background p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-accent flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">★ {c.rating} · {c.reviews} Bew. · {c.city}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-success/15 text-success-foreground rounded px-1.5 py-0.5">ETA {c.etaHours}h</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[11px] text-muted-foreground">Demo-Daten · {tickets.length} aktive Tickets im Bestand</p>
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
