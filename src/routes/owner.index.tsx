import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { Building2, AlertOctagon, ShieldCheck, Wallet, Sparkles, ArrowRight } from "lucide-react";
import { useApprovals, useFinancialSummary, useProperties, useTickets, useUpdateApprovalDecision } from "@/lib/api";
import { isOpenTicket } from "@/lib/ticketStatus";

export const Route = createFileRoute("/owner/")({ component: OwnerHome });

function OwnerHome() {
  const { t, lang } = useLang();
  const propertiesQuery = useProperties();
  const ticketsQuery = useTickets();
  const approvalsQuery = useApprovals();
  const financialSummaryQuery = useFinancialSummary();
  const propertyData = propertiesQuery.data;
  const ticketData = ticketsQuery.data;
  const approvalData = approvalsQuery.data;
  const financialSummary = financialSummaryQuery.data;
  const updateApproval = useUpdateApprovalDecision();
  const properties = propertyData ?? [];
  const tickets = ticketData ?? [];
  const openCases = tickets.filter(isOpenTicket).length;
  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const hasApprovalData = Array.isArray(approvalData);
  const pendingApprovals = approvalData?.filter((approval) => approval.status === "pending");
  const hasOwnerSummaryData =
    properties.length > 0 ||
    tickets.length > 0 ||
    (pendingApprovals?.length ?? 0) > 0 ||
    (financialSummary?.categoryBreakdown.length ?? 0) > 0;
  const ownerSummaryText = hasOwnerSummaryData
    ? t("odash.summary_text")
    : lang === "EN"
      ? "There are no portfolio, ticket, approval, or invoice records to summarize. Reload mock data from the admin page to restore the owner overview."
      : "Es gibt keine Objekt-, Ticket-, Freigabe- oder Rechnungsdaten fuer diese Zusammenfassung. Lade Mock-Daten im Adminbereich neu, um die Eigentuemer-Uebersicht wiederherzustellen.";

  const kpi = [
    { label: t("odash.kpi_units"), value: totalUnits, sub: `${properties.length} ${t("common.properties")}`, icon: Building2, color: "text-primary bg-primary/10" },
    { label: t("odash.kpi_open"), value: openCases, sub: t("common.open_tickets"), icon: AlertOctagon, color: "text-destructive bg-destructive/10" },
    { label: t("odash.kpi_approvals"), value: hasApprovalData ? (pendingApprovals?.length ?? 0) : 0, sub: "—", icon: ShieldCheck, color: "text-warning bg-warning/10" },
    { label: t("odash.kpi_costs"), value: financialSummary?.ytdSpendLabel ?? "€ 0", sub: `${financialSummary?.budgetUtilization ?? 0}% ${lang === "EN" ? "budget" : "Budget"}`, icon: Wallet, color: "text-success bg-success/10" },
  ];

  const approvals =
    hasApprovalData
      ? (pendingApprovals ?? []).slice(0, 2).map((approval) => ({
          id: approval.id,
          title: approval.title,
          amount: approval.amount,
          urgency: approval.urgency,
          reason: approval.summary,
        }))
      : [];

  return (
    <AppShell title={t("odash.title")} subtitle={t("odash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {(propertiesQuery.isError || ticketsQuery.isError || approvalsQuery.isError || financialSummaryQuery.isError) && (
          <DataErrorState
            title={lang === "EN" ? "Owner dashboard data could not be loaded" : "Eigentuemer-Dashboard konnte nicht geladen werden"}
            description={lang === "EN" ? "At least one backend read failed. This is different from an intentionally empty demo database." : "Mindestens eine Backend-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich leere Demo-Datenbank."}
          />
        )}
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpi.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${k.color}`}><k.icon className="h-4 w-4" /></div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</div>
              <div className="text-[11px] text-muted-foreground">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-ai/10 via-accent/30 to-surface p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-ai/15 text-ai flex items-center justify-center"><Sparkles className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t("odash.summary")}</div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{ownerSummaryText}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Building health */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">{t("odash.health")}</h3>
              <Link to="/owner/issues" className="text-xs text-primary hover:underline inline-flex items-center gap-1">{t("onav.issues")} <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{t("odash.health_sub")}</p>
            <div className="space-y-2">
              {properties.length === 0 && !propertiesQuery.isLoading && (
                <EmptyDataState
                  title={lang === "EN" ? "No properties" : "Keine Objekte"}
                  description={lang === "EN" ? "There are no property records to summarize. Reload mock data from the admin page to restore owner portfolio data." : "Es gibt keine Objekt-Datensaetze fuer diese Zusammenfassung. Lade Mock-Daten im Adminbereich neu, um Portfolio-Daten wiederherzustellen."}
                  className="p-5"
                />
              )}
              {properties.slice(0, 4).map((p) => {
                const open = tickets.filter((tk) => tk.propertyId === p.id && isOpenTicket(tk)).length;
                const health = open === 0 ? "healthy" : open >= 2 ? "urgent" : "attention";
                const color = health === "healthy" ? "bg-success" : health === "urgent" ? "bg-destructive" : "bg-warning";
                return (
                  <Link to="/properties/$id" params={{ id: p.id }} key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors">
                    <div className={`h-2 w-2 rounded-full ${color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.city} · {p.units} {t("prop.units")}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{open} {t("common.open_tickets")}</div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Approvals */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold">{t("odash.approvals_title")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("odash.approvals_sub")}</p>
            <div className="space-y-3">
              {approvals.length === 0 && !approvalsQuery.isLoading && (
                <EmptyDataState
                  title={lang === "EN" ? "No approvals" : "Keine Freigaben"}
                  description={lang === "EN" ? "There are no pending approval records." : "Es gibt keine offenen Freigabe-Datensaetze."}
                  className="p-5"
                />
              )}
              {approvals.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium leading-snug">{a.title[lang]}</div>
                    <div className="text-sm font-semibold shrink-0">{a.amount}</div>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{a.reason[lang]}</p>
                  <div className="mt-2 flex gap-2">
                    <button disabled={updateApproval.isPending} onClick={() => updateApproval.mutate({ data: { id: a.id, status: "approved", role: "owner" } })} className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">{t("odash.approve")}</button>
                    <button disabled={updateApproval.isPending} onClick={() => updateApproval.mutate({ data: { id: a.id, status: "rejected", role: "owner" } })} className="flex-1 inline-flex items-center justify-center rounded-md border border-border bg-surface px-2 py-1.5 text-[11px] hover:bg-accent transition disabled:opacity-50">{t("odash.reject")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold mb-3">{t("odash.cost_breakdown")}</h3>
          <div className="space-y-2.5">
            {(financialSummary?.categoryBreakdown ?? []).length === 0 && !financialSummaryQuery.isLoading && (
              <EmptyDataState
                title={lang === "EN" ? "No cost categories" : "Keine Kostenkategorien"}
                description={lang === "EN" ? "There are no invoices to summarize." : "Es gibt keine Rechnungen fuer diese Zusammenfassung."}
                className="p-5"
              />
            )}
            {(financialSummary?.categoryBreakdown ?? []).map((c) => (
              <div key={c.category.DE} className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground w-24 shrink-0">{c.category[lang]}</div>
                <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, c.pct)}%` }} />
                </div>
                <div className="text-xs font-medium w-20 text-right tabular-nums">{c.amountLabel}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 w-10 justify-end">{c.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
