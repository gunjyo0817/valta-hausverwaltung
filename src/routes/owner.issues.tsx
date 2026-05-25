import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { UrgencyBadge, StatusBadge } from "@/components/Badges";

export const Route = createFileRoute("/owner/issues")({ component: OwnerIssues });

function OwnerIssues() {
  const { t, lang } = useLang();
  const open = tickets.filter((tk) => tk.status !== "resolved");

  return (
    <AppShell title={t("odash.issues_title")} subtitle={t("odash.sub")}>
      <div className="p-6 md:p-8">
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 bg-accent/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">{t("common.summary")}</div>
            <div className="col-span-3">{t("common.property")}</div>
            <div className="col-span-2">{t("common.status")}</div>
            <div className="col-span-2">{t("common.priority")}</div>
          </div>
          {open.map((tk) => (
            <Link key={tk.id} to="/ticket/$id" params={{ id: tk.id }} className="grid grid-cols-12 px-4 py-3 hover:bg-accent/30 transition-colors border-b border-border last:border-b-0 items-center">
              <div className="col-span-1 text-[11px] font-mono text-muted-foreground">{tk.id}</div>
              <div className="col-span-4 min-w-0">
                <div className="text-sm font-medium truncate">{tk.title[lang]}</div>
                <div className="text-[11px] text-muted-foreground truncate">{tk.createdAt[lang]}</div>
              </div>
              <div className="col-span-3 text-xs text-muted-foreground truncate">{tk.tenant.building}</div>
              <div className="col-span-2"><StatusBadge status={tk.status} /></div>
              <div className="col-span-2"><UrgencyBadge urgency={tk.urgency} /></div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
