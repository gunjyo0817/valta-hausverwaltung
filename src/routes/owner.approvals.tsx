import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { Sparkles, ShieldCheck, Clock, AlertTriangle, Wallet, FileQuestion } from "lucide-react";

export const Route = createFileRoute("/owner/approvals")({ component: OwnerApprovals });

type Approval = {
  id: string;
  property: string;
  title: { DE: string; EN: string };
  summary: { DE: string; EN: string };
  contractor: string;
  amount: string;
  amountNum: number;
  timeline: { DE: string; EN: string };
  recommendation: { DE: string; EN: string };
  risk: "high" | "medium" | "low";
  urgency: "critical" | "high" | "medium" | "low";
};

const approvals: Approval[] = [
  {
    id: "AP-104",
    property: "Lindenstraße 22",
    title: { DE: "Heizungsanlage – Tausch", EN: "Heating system — replacement" },
    summary: { DE: "Zentralheizung mit 3 Ausfällen in 30 Tagen. Ersatzteile für Modell nicht mehr verfügbar.", EN: "Central heating with 3 failures in 30 days. Spare parts for this model no longer available." },
    contractor: "Müller Heizung GmbH",
    amount: "€ 12.400",
    amountNum: 12400,
    timeline: { DE: "5–7 Werktage nach Freigabe", EN: "5–7 business days after approval" },
    recommendation: { DE: "Empfohlen: Austausch lohnt sich. Reparaturhistorie zeigt Eskalation, Angebot 8 % unter Marktdurchschnitt.", EN: "Recommended: replacement is cost-effective. Repair history shows escalation, quote 8% below market average." },
    risk: "high",
    urgency: "critical",
  },
  {
    id: "AP-103",
    property: "Parkallee 110",
    title: { DE: "Dachsanierung", EN: "Roof repair" },
    summary: { DE: "Wassereintritt im Dachgeschoss nach Sturm. 2 Wohnungen betroffen.", EN: "Water ingress in attic after storm. 2 apartments affected." },
    contractor: "Dachdecker Hansen",
    amount: "€ 8.900",
    amountNum: 8900,
    timeline: { DE: "10 Werktage", EN: "10 business days" },
    recommendation: { DE: "Empfohlen: Angebot marktgerecht, Versicherung deckt voraussichtlich 60 %.", EN: "Recommended: quote is in line with market, insurance likely covers 60%." },
    risk: "medium",
    urgency: "high",
  },
  {
    id: "AP-105",
    property: "Parkallee 110",
    title: { DE: "Aufzugswartung – Jahresvertrag", EN: "Elevator maintenance — annual contract" },
    summary: { DE: "Verlängerung des Wartungsvertrags inkl. 24/7 Notdienst.", EN: "Renewal of maintenance contract including 24/7 emergency service." },
    contractor: "Schindler Service",
    amount: "€ 5.700",
    amountNum: 5700,
    timeline: { DE: "Laufzeit 12 Monate", EN: "12-month term" },
    recommendation: { DE: "Zur Prüfung: Preis +6 % YoY. Alternativangebot von Kone verfügbar (€ 5.200).", EN: "Review: price +6% YoY. Alternative quote from Kone available (€ 5,200)." },
    risk: "low",
    urgency: "medium",
  },
];

const riskColor: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};

function OwnerApprovals() {
  const { t, lang } = useLang();
  const total = approvals.reduce((s, a) => s + a.amountNum, 0);
  const critical = approvals.filter((a) => a.urgency === "critical").length;

  const kpis = [
    { icon: ShieldCheck, label: lang === "EN" ? "Pending approvals" : "Offene Freigaben", value: String(approvals.length), color: "text-primary bg-primary/10" },
    { icon: Wallet, label: lang === "EN" ? "Total pending amount" : "Offener Gesamtbetrag", value: `€ ${total.toLocaleString("de-DE")}`, color: "text-info bg-info/10" },
    { icon: AlertTriangle, label: lang === "EN" ? "Critical approvals" : "Kritische Freigaben", value: String(critical), color: "text-destructive bg-destructive/10" },
    { icon: Clock, label: lang === "EN" ? "Avg. approval time" : "Ø Freigabezeit", value: "1.8 d", color: "text-warning bg-warning/10" },
  ];

  return (
    <AppShell title={lang === "EN" ? "Pending approvals" : "Offene Freigaben"} subtitle={t("odash.approvals_sub")}>
      <div className="p-4 md:p-8 space-y-5 max-w-5xl">
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
                <button className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">{t("odash.approve")}</button>
                <button className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition">{t("odash.reject")}</button>
                <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition">
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
