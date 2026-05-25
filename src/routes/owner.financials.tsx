import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { Wallet, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/owner/financials")({ component: OwnerFinancials });

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const series = [4200, 3800, 5100, 4600, 3900, 4400, 5200, 4800, 4100, 3700, 3500, 4830];

function OwnerFinancials() {
  const { t } = useLang();
  const max = Math.max(...series);

  return (
    <AppShell title={t("odash.financials_title")} subtitle={t("odash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { label: t("odash.kpi_costs"), value: "€ 48.230", trend: -12, color: "text-success" },
            { label: "Q2 vs Q1", value: "€ 13.560", trend: -8, color: "text-success" },
            { label: t("kpi.urgent"), value: "€ 12.400", trend: 24, color: "text-destructive" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> {k.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className={`mt-1 text-xs flex items-center gap-1 ${k.color}`}>
                {k.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {k.trend > 0 ? "+" : ""}{k.trend}% YoY
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold mb-4">Wartungskosten · 12 Monate</h3>
          <div className="flex items-end gap-2 h-48">
            {series.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors" style={{ height: `${(v / max) * 100}%` }} />
                <div className="text-[10px] text-muted-foreground">{months[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
