import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  useClearDemoData,
  useDemoDataStatus,
  useReloadDemoData,
  type DemoDataStatusDto,
  type DemoDataTable,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/demo-data")({
  head: () => ({
    meta: [
      { title: "Demo Data Admin · Valta" },
      { name: "description", content: "Clear and reload Valta demo data." },
    ],
  }),
  component: DemoDataAdmin,
});

const identityTables: DemoDataTable[] = ["organizations", "users", "userRoles"];
const mutableTables: DemoDataTable[] = [
  "properties",
  "units",
  "tenants",
  "contractors",
  "tickets",
  "ticketEvents",
  "ticketAssignments",
  "documents",
  "notifications",
  "aiActivities",
  "aiSuggestions",
  "approvals",
  "invoices",
];

const labels: Record<DemoDataTable, string> = {
  organizations: "Organizations",
  users: "Users",
  userRoles: "User roles",
  properties: "Properties",
  units: "Units",
  tenants: "Tenants",
  contractors: "Contractors",
  tickets: "Tickets",
  ticketEvents: "Ticket events",
  ticketAssignments: "Ticket assignments",
  documents: "Documents",
  notifications: "Notifications",
  aiActivities: "AI activity",
  aiSuggestions: "AI suggestions",
  approvals: "Approvals",
  invoices: "Invoices",
};

type PendingAction = "clear" | "reload" | null;

function DemoDataAdmin() {
  const statusQuery = useDemoDataStatus();
  const clearMutation = useClearDemoData();
  const reloadMutation = useReloadDemoData();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const status = statusQuery.data;
  const busy = clearMutation.isPending || reloadMutation.isPending || statusQuery.isFetching;
  const enabled = status?.enabled ?? false;

  const runAction = async () => {
    if (!pendingAction) return;
    setLastMessage(null);
    try {
      if (pendingAction === "clear") {
        const result = await clearMutation.mutateAsync({ data: { confirm: "CLEAR_DEMO_DATA" } });
        setLastMessage(`Cleared demo data. Mutable rows: ${result.after.mutableTotal}.`);
      } else {
        const result = await reloadMutation.mutateAsync({ data: { confirm: "RELOAD_DEMO_DATA" } });
        setLastMessage(`Reloaded mock data. Mutable rows: ${result.after.mutableTotal}.`);
      }
      setPendingAction(null);
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : "Demo data action failed.");
    }
  };

  return (
    <AppShell title="Demo data admin" subtitle="Clear mutable demo data and reload the mock database state.">
      <div className="p-4 md:p-8 space-y-6 max-w-6xl">
        <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="h-4 w-4 text-primary" />
                Demo database controls
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                These controls are for prototype demos. They preserve demo accounts and role switching while clearing or restoring mutable demo records.
              </p>
              {status?.reason && (
                <div className="mt-3 inline-flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{status.reason}</span>
                </div>
              )}
              {lastMessage && (
                <div className="mt-3 inline-flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  <span>{lastMessage}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPendingAction("clear")}
                disabled={!enabled || busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-background px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear demo data
              </button>
              <button
                onClick={() => setPendingAction("reload")}
                disabled={!enabled || busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload mock data
              </button>
            </div>
          </div>
        </section>

        {statusQuery.isLoading ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
            Loading demo database status
          </div>
        ) : statusQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-surface p-6 text-sm">
            <div className="font-semibold text-destructive">Could not load demo database status.</div>
            <p className="mt-1 text-muted-foreground">
              {statusQuery.error instanceof Error ? statusQuery.error.message : "Unknown error"}
            </p>
          </div>
        ) : status ? (
          <>
            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SummaryCard label="Mutable demo rows" value={status.mutableTotal} />
              <SummaryCard label="Identity rows preserved" value={status.identityTotal} />
              <SummaryCard label="Controls" value={status.enabled ? "Enabled" : "Disabled"} textValue />
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CountsSection
                title="Preserved accounts"
                description="These records stay in place when demo data is cleared."
                icon="identity"
                status={status}
                tables={identityTables}
              />
              <CountsSection
                title="Mutable demo data"
                description="These records are cleared and rebuilt by the admin actions."
                icon="mutable"
                status={status}
                tables={mutableTables}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
              <span>Last checked: {new Date(status.checkedAt).toLocaleString()}</span>
              <button
                onClick={() => void statusQuery.refetch()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 font-semibold text-foreground hover:bg-accent disabled:opacity-50"
              >
                {statusQuery.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Refresh counts
              </button>
            </div>
          </>
        ) : null}

        <div className="text-xs text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-elegant">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  pendingAction === "clear" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                )}
              >
                {pendingAction === "clear" ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {pendingAction === "clear" ? "Clear mutable demo data?" : "Reload mock demo data?"}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pendingAction === "clear"
                    ? "This removes tickets, properties, contractors, notifications, approvals, invoices, documents, and AI records. Demo accounts stay available."
                    : "This first clears mutable demo data, then reloads the seeded mock records used by the prototype."}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingAction(null)}
                disabled={busy}
                className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void runAction()}
                disabled={busy}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50",
                  pendingAction === "clear" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
                )}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {pendingAction === "clear" ? "Clear data" : "Reload data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({ label, value, textValue = false }: { label: string; value: number | string; textValue?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-2 font-semibold", textValue ? "text-lg" : "text-2xl tabular-nums")}>{value}</div>
    </div>
  );
}

function CountsSection({
  title,
  description,
  icon,
  status,
  tables,
}: {
  title: string;
  description: string;
  icon: "identity" | "mutable";
  status: DemoDataStatusDto;
  tables: DemoDataTable[];
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <header className="flex items-start gap-3 border-b border-border p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          {icon === "identity" ? <ShieldCheck className="h-4 w-4" /> : <Database className="h-4 w-4" />}
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="divide-y divide-border">
        {tables.map((table) => (
          <div key={table} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{labels[table]}</span>
            <span className="font-mono text-xs font-semibold tabular-nums">{status.counts[table]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
