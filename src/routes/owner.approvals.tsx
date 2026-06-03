import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { Sparkles, ShieldCheck, Clock, AlertTriangle, Wallet, FileQuestion } from "lucide-react";
import { useApprovals, useUpdateApprovalDecision } from "@/lib/api";
import type { ApprovalDto, ApprovalStatus } from "@/lib/api";

export const Route = createFileRoute("/owner/approvals")({ component: OwnerApprovals });

const riskColor: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};

function OwnerApprovals() {
  const { t, lang } = useLang();
  const approvalsQuery = useApprovals();
  const updateApproval = useUpdateApprovalDecision();
  const [clarificationId, setClarificationId] = useState<string | null>(null);
  const [clarificationMessage, setClarificationMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const approvals: ApprovalDto[] = approvalsQuery.data?.filter((approval) => approval.status === "pending") ?? [];
  const total = approvals.reduce((s, a) => s + a.amountNum, 0);
  const critical = approvals.filter((a) => a.urgency === "critical").length;

  const submitDecision = async (id: string, status: Exclude<ApprovalStatus, "pending">, message?: string) => {
    setActionError(null);
    try {
      await updateApproval.mutateAsync({ data: { id, status, role: "owner", message } });
      setClarificationId(null);
      setClarificationMessage("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : lang === "EN" ? "The approval action failed." : "Die Freigabe-Aktion ist fehlgeschlagen.");
    }
  };

  const kpis = [
    { icon: ShieldCheck, label: lang === "EN" ? "Pending approvals" : "Offene Freigaben", value: String(approvals.length), color: "text-primary bg-primary/10" },
    { icon: Wallet, label: lang === "EN" ? "Total pending amount" : "Offener Gesamtbetrag", value: `€ ${total.toLocaleString("de-DE")}`, color: "text-info bg-info/10" },
    { icon: AlertTriangle, label: lang === "EN" ? "Critical approvals" : "Kritische Freigaben", value: String(critical), color: "text-destructive bg-destructive/10" },
    { icon: Clock, label: lang === "EN" ? "Avg. approval time" : "Ø Freigabezeit", value: "1.8 d", color: "text-warning bg-warning/10" },
  ];

  return (
    <AppShell title={lang === "EN" ? "Pending approvals" : "Offene Freigaben"} subtitle={t("odash.approvals_sub")}>
      <div className="p-4 md:p-8 space-y-5 max-w-5xl">
        {approvalsQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Approvals could not be loaded" : "Freigaben konnten nicht geladen werden"}
            description={lang === "EN" ? "The approvals request failed. This is different from an intentionally empty demo database." : "Die Freigabe-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich geleerte Demo-Datenbank."}
          />
        )}
        {actionError && (
          <DataErrorState
            title={lang === "EN" ? "Approval action failed" : "Freigabe-Aktion fehlgeschlagen"}
            description={actionError}
          />
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-3 md:p-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${k.color}`}><k.icon className="h-4 w-4" /></div>
                <div className="text-[11px] md:text-xs text-muted-foreground leading-tight">{k.label}</div>
              </div>
              <div className="mt-2 text-lg md:text-2xl font-semibold tabular-nums">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {approvals.length === 0 && !approvalsQuery.isLoading && (
            <EmptyDataState
              title={lang === "EN" ? "No pending approvals" : "Keine offenen Freigaben"}
              description={lang === "EN" ? "There are no pending approval records. Reload mock data from the admin page to restore owner approvals." : "Es gibt keine offenen Freigabe-Datensaetze. Lade Mock-Daten im Adminbereich neu, um Eigentuemer-Freigaben wiederherzustellen."}
            />
          )}
          {approvals.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-surface p-4 md:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-muted-foreground">{a.id}</span>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${riskColor[a.risk]}`}>
                      {(lang === "EN" ? "Risk: " : "Risiko: ") + (lang === "EN" ? a.risk : { high: "hoch", medium: "mittel", low: "niedrig" }[a.risk])}
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold mt-1">{a.title[lang]}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.property} · {a.contractor}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl md:text-2xl font-semibold tabular-nums">{a.amount}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1 justify-end"><Clock className="h-3 w-3" />{a.timeline[lang]}</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-foreground">{a.summary[lang]}</div>

              <div className="mt-3 rounded-lg border border-ai/20 bg-ai/5 p-2.5 flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-ai mt-0.5 shrink-0" />
                <div className="text-xs text-foreground">{a.recommendation[lang]}</div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {a.links.map((link) =>
                  link.path === "/properties/$id" && link.params?.id ? (
                    <Link key={`${a.id}-${link.path}`} to="/properties/$id" params={{ id: link.params.id }} className="text-xs text-primary hover:underline">
                      {link.label[lang]}
                    </Link>
                  ) : (
                    <Link key={`${a.id}-${link.path}`} to="/owner/financials" className="text-xs text-primary hover:underline">
                      {link.label[lang]}
                    </Link>
                  ),
                )}
              </div>

              {clarificationId === a.id && (
                <div className="mt-3 rounded-lg border border-border bg-surface-muted p-3 space-y-2">
                  <label className="text-xs font-medium" htmlFor={`clarification-${a.id}`}>
                    {lang === "EN" ? "Clarification message" : "Rückfrage"}
                  </label>
                  <textarea
                    id={`clarification-${a.id}`}
                    value={clarificationMessage}
                    onChange={(event) => setClarificationMessage(event.target.value)}
                    className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={lang === "EN" ? "What should the property manager clarify?" : "Was soll die Verwaltung klären?"}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={updateApproval.isPending || clarificationMessage.trim().length === 0}
                      onClick={() => submitDecision(a.id, "clarification_requested", clarificationMessage)}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {lang === "EN" ? "Send request" : "Rückfrage senden"}
                    </button>
                    <button
                      disabled={updateApproval.isPending}
                      onClick={() => {
                        setClarificationId(null);
                        setClarificationMessage("");
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition disabled:opacity-50"
                    >
                      {lang === "EN" ? "Cancel" : "Abbrechen"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={updateApproval.isPending} onClick={() => submitDecision(a.id, "approved")} className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">{t("odash.approve")}</button>
                <button disabled={updateApproval.isPending} onClick={() => submitDecision(a.id, "rejected")} className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition disabled:opacity-50">{t("odash.reject")}</button>
                <button
                  disabled={updateApproval.isPending}
                  onClick={() => {
                    setClarificationId(a.id);
                    setClarificationMessage("");
                    setActionError(null);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition disabled:opacity-50"
                >
                  <FileQuestion className="h-3.5 w-3.5" />
                  {lang === "EN" ? "Request clarification" : "Rückfrage senden"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
