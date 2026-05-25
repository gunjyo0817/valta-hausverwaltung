import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/owner/approvals")({ component: OwnerApprovals });

const approvals = [
  { id: "AP-104", title: { DE: "Heizungsanlage Lindenstr. 22 – Tausch", EN: "Heating system Lindenstr. 22 — replacement" }, amount: "€ 12.400", contractor: "Müller Heizung GmbH", urgency: "high", reason: { DE: "3 wiederkehrende Ausfälle in 30 Tagen. Reparatur lohnt sich nicht mehr.", EN: "3 recurring failures in 30 days. Repairs no longer cost-effective." } },
  { id: "AP-103", title: { DE: "Dachsanierung Parkallee 110", EN: "Roof repair Parkallee 110" }, amount: "€ 8.900", contractor: "Dachdecker Hansen", urgency: "medium", reason: { DE: "Wassereintritt nach Sturm, vergleichbares Angebot bestätigt.", EN: "Water ingress after storm, comparable quote confirmed." } },
  { id: "AP-099", title: { DE: "Hauseingangstür Goethestr. 8", EN: "Front door Goethestr. 8" }, amount: "€ 3.450", contractor: "Schreinerei Wolf", urgency: "low", reason: { DE: "Schließanlage defekt, Sicherheitsrisiko.", EN: "Lock broken, security concern." } },
];

function OwnerApprovals() {
  const { t, lang } = useLang();

  return (
    <AppShell title={t("odash.approvals_page")} subtitle={t("odash.approvals_sub")}>
      <div className="p-6 md:p-8 space-y-3 max-w-4xl">
        {approvals.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-warning/15 text-warning flex items-center justify-center shrink-0"><ShieldCheck className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-muted-foreground">{a.id}</div>
                    <h3 className="text-sm font-semibold mt-0.5">{a.title[lang]}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.contractor}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold tabular-nums">{a.amount}</div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-ai/20 bg-ai/5 p-2.5 flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-ai mt-0.5 shrink-0" />
                  <div className="text-xs text-foreground">{a.reason[lang]}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">{t("odash.approve")}</button>
                  <button className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-xs hover:bg-accent transition">{t("odash.reject")}</button>
                  <button className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-xs hover:bg-accent transition ml-auto">Details</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
