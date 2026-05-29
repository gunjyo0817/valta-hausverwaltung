import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { StatusBadge, UrgencyBadge } from "@/components/Badges";
import { AlertOctagon, Clock, Building2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/owner/issues")({ component: OwnerIssues });

const etaByUrgency: Record<string, { DE: string; EN: string }> = {
  critical: { DE: "Innerhalb 4 Std.", EN: "Within 4 h" },
  high: { DE: "Innerhalb 24 Std.", EN: "Within 24 h" },
  medium: { DE: "2–3 Werktage", EN: "2–3 business days" },
  low: { DE: "Nächste Wartung", EN: "Next maintenance" },
};

function OwnerIssues() {
  const { t, lang } = useLang();
  const open = tickets.filter((tk) => tk.status !== "resolved");
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const filtered = filter === "all" ? open : open.filter((tk) => tk.urgency === filter);

  const counts = {
    all: open.length,
    critical: open.filter((tk) => tk.urgency === "critical").length,
    high: open.filter((tk) => tk.urgency === "high").length,
    medium: open.filter((tk) => tk.urgency === "medium").length,
  };

  return (
    <AppShell title={t("odash.issues_title")} subtitle={t("odash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ["all", lang === "EN" ? "Open total" : "Offen gesamt", "text-primary bg-primary/10"],
            ["critical", t("urgency.critical"), "text-destructive bg-destructive/10"],
            ["high", t("urgency.high"), "text-warning bg-warning/10"],
            ["medium", t("urgency.medium"), "text-info bg-info/10"],
          ] as const).map(([k, label, color]) => (
            <button key={k} onClick={() => setFilter(k as any)} className={`text-left rounded-xl border bg-surface p-4 transition-colors ${filter === k ? "border-primary" : "border-border hover:border-primary/40"}`}>
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${color}`}><AlertOctagon className="h-4 w-4" /></div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{counts[k]}</div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">{t("common.summary")}</div>
            <div className="col-span-2">{t("common.category")}</div>
            <div className="col-span-3">{t("common.property")}</div>
            <div className="col-span-1">{t("common.status")}</div>
            <div className="col-span-1">{t("common.priority")}</div>
            <div className="col-span-1 text-right">{lang === "EN" ? "Est. resolution" : "Vorauss. Lösung"}</div>
          </div>
          {filtered.map((tk) => (
            <Link key={tk.id} to="/ticket/$id" params={{ id: tk.id }} className="grid grid-cols-12 px-4 py-3 hover:bg-accent/30 border-b border-border last:border-b-0 items-center">
              <div className="col-span-1 text-[11px] font-mono text-muted-foreground">{tk.id}</div>
              <div className="col-span-3 min-w-0">
                <div className="text-sm font-semibold truncate">{tk.title[lang]}</div>
                <div className="text-[11px] text-muted-foreground truncate">{tk.createdAt[lang]} · {tk.contractorName ?? "—"}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">{tk.category[lang]}</div>
              <div className="col-span-3 text-xs text-muted-foreground truncate flex items-center gap-1"><Building2 className="h-3 w-3" />{tk.tenant.building}</div>
              <div className="col-span-1"><StatusBadge status={tk.status} /></div>
              <div className="col-span-1"><UrgencyBadge urgency={tk.urgency} /></div>
              <div className="col-span-1 text-right text-[11px] text-muted-foreground inline-flex items-center justify-end gap-1"><Clock className="h-3 w-3" />{etaByUrgency[tk.urgency][lang]}</div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">{t("common.no_results")}</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
