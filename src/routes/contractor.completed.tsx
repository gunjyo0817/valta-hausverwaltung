import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contractor/completed")({ component: Completed });

function Completed() {
  const { t, lang } = useLang();
  const resolved = tickets.filter((tk) => tk.status === "resolved");
  // mock a few more
  const extra = [
    { id: "VLT-2019", title: { DE: "Wasserhahn tropft – Küche", EN: "Dripping tap — kitchen" }, building: "Goethestraße 8, München", at: { DE: "Vor 3 Tagen", EN: "3 days ago" } },
    { id: "VLT-2014", title: { DE: "Heizkörper entlüften", EN: "Bleed radiator" }, building: "Lindenstraße 22, Berlin", at: { DE: "Vor 5 Tagen", EN: "5 days ago" } },
    { id: "VLT-2008", title: { DE: "Thermostat ersetzt", EN: "Replaced thermostat" }, building: "Parkallee 110, Hamburg", at: { DE: "Vor 1 Woche", EN: "1 week ago" } },
  ];

  return (
    <AppShell title={t("cdash.completed_title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8 max-w-4xl space-y-2">
        {[...resolved.map((r) => ({ id: r.id, title: r.title, building: r.tenant.building, at: r.createdAt })), ...extra].map((j) => (
          <div key={j.id} className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-success/15 text-success flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">{j.id}</span>
                <span className="text-sm font-medium truncate">{j.title[lang]}</span>
              </div>
              <div className="text-xs text-muted-foreground">{j.building} · {j.at[lang]}</div>
            </div>
            <div className="text-[11px] font-medium text-success">✓ {t("status.resolved")}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
