import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { Wallet, TrendingDown, TrendingUp, FileText, Download } from "lucide-react";
import { useFinancialSummary, useInvoices } from "@/lib/api";

export const Route = createFileRoute("/owner/financials")({ component: OwnerFinancials });

function OwnerFinancials() {
  const { t, lang } = useLang();
  const invoicesQuery = useInvoices();
  const financialSummaryQuery = useFinancialSummary();
  const invoices = invoicesQuery.data ?? [];
  const summary = financialSummaryQuery.data;
  const series = summary?.monthlySeries ?? [];
  const breakdown = summary?.categoryBreakdown ?? [];
  const max = Math.max(1, ...series.map((item) => item.amount));
  const utilization = summary?.budgetUtilization ?? 0;
  const exportCsv = () => {
    const header = ["Invoice", "Date", "Contractor", "Property", "Amount", "Status"];
    const rows = invoices.map((inv) => [inv.id, inv.date, inv.contractor, inv.property, inv.amount, inv.status]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "valta-invoices.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title={t("odash.financials_title")} subtitle={t("odash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {(invoicesQuery.isError || financialSummaryQuery.isError) && (
          <DataErrorState
            title={lang === "EN" ? "Financial data could not be loaded" : "Finanzdaten konnten nicht geladen werden"}
            description={lang === "EN" ? "The financial request failed. This is different from an intentionally empty demo database." : "Die Finanz-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich geleerte Demo-Datenbank."}
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === "EN" ? "Monthly spend" : "Monatlich", value: summary?.monthlySpendLabel ?? "€ 0", trend: summary?.trendMonthlyPct ?? 0, color: (summary?.trendMonthlyPct ?? 0) <= 0 ? "text-success" : "text-destructive" },
            { label: lang === "EN" ? "YTD spend" : "Wartung YTD", value: summary?.ytdSpendLabel ?? "€ 0", trend: summary?.trendYtdPct ?? 0, color: (summary?.trendYtdPct ?? 0) <= 0 ? "text-success" : "text-destructive" },
            { label: lang === "EN" ? "Annual budget" : "Jahresbudget", value: summary?.annualBudgetLabel ?? "€ 0", trend: 0, color: "text-muted-foreground" },
            { label: lang === "EN" ? "Critical cases" : "Kritische Fälle", value: summary?.criticalCaseCostLabel ?? "€ 0", trend: summary?.trendCriticalPct ?? 0, color: "text-destructive" },
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

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{lang === "EN" ? "Budget utilization" : "Budget-Auslastung"}</h3>
            <span className="text-xs text-muted-foreground tabular-nums">{utilization}% · {summary?.ytdSpendLabel ?? "€ 0"} / {summary?.annualBudgetLabel ?? "€ 0"}</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${utilization}%` }} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold mb-4">{lang === "EN" ? "Maintenance costs · 12 months" : "Wartungskosten · 12 Monate"}</h3>
            {series.length === 0 && !financialSummaryQuery.isLoading ? (
              <EmptyDataState
                title={lang === "EN" ? "No cost history" : "Keine Kostenhistorie"}
                description={lang === "EN" ? "There are no invoice records for the monthly chart." : "Es gibt keine Rechnungs-Datensaetze fuer das Monatsdiagramm."}
                className="p-5"
              />
            ) : (
              <div className="flex items-end gap-2 h-44">
                {series.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors" style={{ height: `${(item.amount / max) * 100}%` }} title={item.label} />
                    <div className="text-[10px] text-muted-foreground">{item.month}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold mb-4">{t("odash.cost_breakdown")}</h3>
            {breakdown.length === 0 && !financialSummaryQuery.isLoading ? (
              <EmptyDataState
                title={lang === "EN" ? "No cost categories" : "Keine Kostenkategorien"}
                description={lang === "EN" ? "There are no invoices to group by category." : "Es gibt keine Rechnungen fuer eine Kategorien-Auswertung."}
                className="p-5"
              />
            ) : (
              <div className="space-y-3">
                {breakdown.map((b) => (
                  <div key={b.category.DE}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{b.category[lang]}</span>
                      <span className="text-muted-foreground tabular-nums">{b.amountLabel} · {b.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/80" style={{ width: `${Math.min(100, b.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
          {invoices.length === 0 && !invoicesQuery.isLoading && (
            <div className="p-8">
              <EmptyDataState
                title={lang === "EN" ? "No invoices" : "Keine Rechnungen"}
                description={lang === "EN" ? "There are no invoice records in the database. Reload mock data from the admin page to restore invoice rows." : "In der Datenbank sind keine Rechnungs-Datensaetze vorhanden. Lade Mock-Daten im Adminbereich neu, um Rechnungen wiederherzustellen."}
              />
            </div>
          )}

          <div className="px-5 py-3 flex justify-end border-t border-border bg-surface-muted">
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <Download className="h-3.5 w-3.5" /> {lang === "EN" ? "Export CSV" : "Als CSV exportieren"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
