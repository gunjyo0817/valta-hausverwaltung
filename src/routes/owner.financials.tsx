import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { Wallet, TrendingDown, TrendingUp, FileText, Download } from "lucide-react";

export const Route = createFileRoute("/owner/financials")({ component: OwnerFinancials });

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const series = [4200, 3800, 5100, 4600, 3900, 4400, 5200, 4800, 4100, 3700, 3500, 4830];

const breakdown = [
  { cat: { DE: "Heizung", EN: "Heating" }, amount: 14200, pct: 29 },
  { cat: { DE: "Sanitär", EN: "Plumbing" }, amount: 9800, pct: 20 },
  { cat: { DE: "Elektrik", EN: "Electrical" }, amount: 7100, pct: 15 },
  { cat: { DE: "Aufzug", EN: "Elevator" }, amount: 6400, pct: 13 },
  { cat: { DE: "Dach & Fassade", EN: "Roof & facade" }, amount: 5800, pct: 12 },
  { cat: { DE: "Sonstiges", EN: "Other" }, amount: 4930, pct: 11 },
];

const invoices = [
  { id: "INV-2041", date: "24.05.2026", contractor: "Müller Heizung GmbH", property: "Lindenstraße 22", amount: "€ 1.240", status: "paid" },
  { id: "INV-2039", date: "22.05.2026", contractor: "Klempner Schulz & Söhne", property: "Goethestraße 8", amount: "€ 680", status: "paid" },
  { id: "INV-2037", date: "20.05.2026", contractor: "Schindler Service", property: "Parkallee 110", amount: "€ 2.150", status: "pending" },
  { id: "INV-2030", date: "18.05.2026", contractor: "Gutachter Bauer", property: "Rosenweg 3", amount: "€ 890", status: "pending" },
  { id: "INV-2025", date: "15.05.2026", contractor: "Hausmeister Krüger", property: "Lindenstraße 22", amount: "€ 120", status: "paid" },
];

function OwnerFinancials() {
  const { t, lang } = useLang();
  const max = Math.max(...series);
  const budget = 60000;
  const ytd = 48230;
  const utilization = Math.round((ytd / budget) * 100);

  return (
    <AppShell title={t("odash.financials_title")} subtitle={t("odash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === "EN" ? "Monthly spend" : "Monatlich", value: "€ 4.830", trend: -6, color: "text-success" },
            { label: lang === "EN" ? "YTD spend" : "Wartung YTD", value: "€ 48.230", trend: -12, color: "text-success" },
            { label: lang === "EN" ? "Annual budget" : "Jahresbudget", value: "€ 60.000", trend: 0, color: "text-muted-foreground" },
            { label: lang === "EN" ? "Critical cases" : "Kritische Fälle", value: "€ 12.400", trend: 24, color: "text-destructive" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> {k.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</div>
              {k.trend !== 0 && (
                <div className={`mt-1 text-xs flex items-center gap-1 ${k.color}`}>
                  {k.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {k.trend > 0 ? "+" : ""}{k.trend}% YoY
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Budget utilization */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{lang === "EN" ? "Budget utilization" : "Budget-Auslastung"}</h3>
            <span className="text-xs text-muted-foreground tabular-nums">{utilization}% · € {ytd.toLocaleString("de-DE")} / € {budget.toLocaleString("de-DE")}</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${utilization}%` }} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Monthly chart */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold mb-4">{lang === "EN" ? "Maintenance costs · 12 months" : "Wartungskosten · 12 Monate"}</h3>
            <div className="flex items-end gap-2 h-44">
              {series.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors" style={{ height: `${(v / max) * 100}%` }} />
                  <div className="text-[10px] text-muted-foreground">{months[i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold mb-4">{t("odash.cost_breakdown")}</h3>
            <div className="space-y-3">
              {breakdown.map((b) => (
                <div key={b.cat.DE}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{b.cat[lang]}</span>
                    <span className="text-muted-foreground tabular-nums">€ {b.amount.toLocaleString("de-DE")} · {b.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/80" style={{ width: `${b.pct * 2.5}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent invoices */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{lang === "EN" ? "Recent invoices" : "Aktuelle Rechnungen"}</h3>
          </div>
          <div className="hidden md:grid grid-cols-12 px-5 py-2.5 bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-2">{lang === "EN" ? "Invoice" : "Rechnung"}</div>
            <div className="col-span-2">{lang === "EN" ? "Date" : "Datum"}</div>
            <div className="col-span-3">{t("common.contractor")}</div>
            <div className="col-span-3">{t("common.property")}</div>
            <div className="col-span-1 text-right">{lang === "EN" ? "Amount" : "Betrag"}</div>
            <div className="col-span-1 text-right">{t("common.status")}</div>
          </div>
          {invoices.map((inv) => (
            <div key={inv.id}>
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-12 px-5 py-3 items-center border-b border-border last:border-b-0 hover:bg-accent/30">
                <div className="col-span-2 text-[11px] font-mono">{inv.id}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{inv.date}</div>
                <div className="col-span-3 text-xs">{inv.contractor}</div>
                <div className="col-span-3 text-xs text-muted-foreground">{inv.property}</div>
                <div className="col-span-1 text-xs text-right font-semibold tabular-nums">{inv.amount}</div>
                <div className="col-span-1 flex justify-end">
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${inv.status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    {inv.status === "paid" ? (lang === "EN" ? "Paid" : "Bezahlt") : (lang === "EN" ? "Pending" : "Offen")}
                  </span>
                </div>
              </div>
              {/* Mobile card */}
              <div className="md:hidden p-4 border-b border-border last:border-b-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-muted-foreground">{inv.id}</div>
                    <div className="text-sm font-medium mt-0.5 truncate">{inv.contractor}</div>
                    <div className="text-xs text-muted-foreground truncate">{inv.property}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums">{inv.amount}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{inv.date}</div>
                  </div>
                </div>
                <div>
                  <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${inv.status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    {inv.status === "paid" ? (lang === "EN" ? "Paid" : "Bezahlt") : (lang === "EN" ? "Pending" : "Offen")}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="px-5 py-3 flex justify-end border-t border-border bg-surface-muted">
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <Download className="h-3.5 w-3.5" /> {lang === "EN" ? "Export CSV" : "Als CSV exportieren"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
