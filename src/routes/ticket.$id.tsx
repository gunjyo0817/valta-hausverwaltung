import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import { getTicket } from "@/lib/mockData";
import { AssignContractorModal } from "@/components/AssignContractorModal";
import {
  ArrowLeft,
  Sparkles,
  Wrench,
  Phone,
  MapPin,
  Image as ImageIcon,
  Languages,
  CheckCheck,
  Pencil,
  MessageSquareText,
  AlertTriangle,
  Send,
  Bot,
  User,
  HardHat,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/ticket/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Valta` },
      { name: "description", content: "AI-strukturiertes Reparatur-Ticket mit Zusammenfassung, Handwerker-Empfehlung und Verlauf." },
    ],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { id } = useParams({ from: "/ticket/$id" });
  const t = getTicket(id);
  const { lang, t: tr } = useLang();
  const [showAssign, setShowAssign] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [editDraft, setEditDraft] = useState(false);
  const [sent, setSent] = useState(false);

  const draftDE = `Hallo ${t.tenant.name.split(" ")[0]},\n\nvielen Dank für Ihre Meldung. Wir haben einen Heizungsnotdienst beauftragt – ETA heute zwischen 11:00 und 13:00 Uhr. Sie erhalten ein Update, sobald der Techniker unterwegs ist.\n\nBeste Grüße\nIhre Hausverwaltung`;
  const draftEN = `Hi ${t.tenant.name.split(" ")[0]},\n\nthanks for your report. We've dispatched an emergency heating technician — ETA today between 11:00 and 13:00. You'll get an update once the technician is on the way.\n\nBest\nYour property management`;
  const draft = lang === "EN" ? draftEN : draftDE;

  return (
    <AppShell title={`${t.id} · ${t.title}`} subtitle={`${t.tenant.building} · ${t.tenant.apartment}`}>
      <div className="p-4 md:p-8">
        <Link to="/inbox" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" /> {lang === "EN" ? "Back to inbox" : "Zurück zur Inbox"}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <UrgencyBadge urgency={t.urgency} />
                <StatusBadge status={t.status} />
                <AIBadge confidence={t.confidence} />
                <button onClick={() => setTranslated((v) => !v)} className="ml-auto inline-flex items-center gap-1.5 text-xs border border-border rounded-md px-2 py-1 hover:bg-accent">
                  <Languages className="h-3.5 w-3.5" /> {translated ? "Original (DE)" : "EN"}
                </button>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                {translated ? "Heating completely down" : t.title}
              </h2>
              <div className="mt-4 rounded-xl ai-gradient p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-ai" /> {tr("common.summary")}
                </div>
                <p className="mt-2 text-sm leading-relaxed">
                  {translated
                    ? "Tenant reports complete heating failure since yesterday evening. Outside temperature below 5 °C. Entire apartment affected. High urgency recommended."
                    : t.summary}
                </p>
              </div>
              <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{t.description}</p>

              {/* Structured metadata */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Meta label="Kategorie" value={t.category} />
                <Meta label="Seit" value={t.createdAt} />
                <Meta label="Sprache" value={t.tenant.language} />
                <Meta label="Fotos" value={`${t.photos}`} />
              </div>
            </div>

            {/* Unified timeline */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquareText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{tr("common.timeline")}</h3>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {lang === "EN" ? "All channels consolidated" : "Alle Kanäle zentralisiert"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {lang === "EN" ? "E-mail, SMS, app, phone — unified into one operational thread." : "E-Mail, SMS, App, Telefon – vereint in einem operativen Thread."}
              </p>
              <ol className="relative space-y-4 pl-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
                {t.history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className={cn(
                      "absolute -left-[14px] top-1 h-3 w-3 rounded-full ring-4 ring-surface flex items-center justify-center",
                      h.type === "ai" && "bg-ai",
                      h.type === "tenant" && "bg-info",
                      h.type === "manager" && "bg-primary",
                      h.type === "contractor" && "bg-success",
                    )} />
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {h.type === "ai" ? <Bot className="h-3 w-3 text-ai" /> :
                        h.type === "tenant" ? <User className="h-3 w-3 text-info" /> :
                        h.type === "manager" ? <ShieldCheck className="h-3 w-3 text-primary" /> :
                        <HardHat className="h-3 w-3 text-success" />}
                      <span className="font-medium text-foreground">
                        {h.type === "ai" ? "Valta AI" : h.type === "tenant" ? t.tenant.name : h.type === "manager" ? "Sarah Krüger" : "Müller Heizung GmbH"}
                      </span>
                      <span>·</span>
                      <span>{h.at}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug">{h.text}</p>
                  </li>
                ))}
                {sent && (
                  <li className="relative">
                    <span className="absolute -left-[14px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-surface" />
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <ShieldCheck className="h-3 w-3 text-primary" />
                      <span className="font-medium text-foreground">Sarah Krüger</span>
                      <span>·</span><span>jetzt</span>
                      <span className="rounded bg-ai/10 text-ai px-1.5 py-0.5 text-[10px]">AI-Entwurf freigegeben</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug whitespace-pre-line">{draft}</p>
                  </li>
                )}
              </ol>
            </div>

            {t.photos > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <h3 className="text-sm font-semibold mb-3">{lang === "EN" ? "Attached photos" : "Angehängte Fotos"}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: t.photos }).map((_, i) => (
                    <div key={i} className="aspect-video rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: COPILOT */}
          <aside className="space-y-4 lg:sticky lg:top-20 self-start">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-ai" /> AI Copilot
                <span className="ml-auto text-[10px] uppercase tracking-wider bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                  {lang === "EN" ? "Suggests — you approve" : "Schlägt vor — Sie entscheiden"}
                </span>
              </div>
            </div>

            {/* Reply draft */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{lang === "EN" ? "Reply draft" : "Antwortentwurf"}</span>
                <AIBadge confidence={94} />
              </div>
              {editDraft ? (
                <textarea defaultValue={draft} className="w-full h-40 text-sm rounded-md border border-border bg-background p-2 outline-none focus:ring-2 focus:ring-ring" />
              ) : (
                <pre className={cn("whitespace-pre-wrap font-sans text-sm leading-snug text-foreground/90 transition-opacity", sent && "opacity-50")}>{draft}</pre>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={sent}
                  onClick={() => setSent(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> {sent ? (lang === "EN" ? "Sent" : "Gesendet") : tr("act.approve")}
                </button>
                <button onClick={() => setEditDraft((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent">
                  <Pencil className="h-3.5 w-3.5" /> {editDraft ? (lang === "EN" ? "Done" : "Fertig") : tr("act.edit")}
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent">
                  <Send className="h-3.5 w-3.5" /> {tr("act.manual")}
                </button>
              </div>
            </div>

            {/* Missing info / Request */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" /> {lang === "EN" ? "Missing information detected" : "Fehlende Informationen erkannt"}
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
                <li>• {lang === "EN" ? "Exact thermostat model" : "Genauer Thermostat-Typ"}</li>
                <li>• {lang === "EN" ? "Confirmation: are neighbours affected?" : "Bestätigung: Sind Nachbarn betroffen?"}</li>
              </ul>
              <button onClick={() => setShowInfo(true)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent">
                <MessageSquareText className="h-3.5 w-3.5" /> {tr("act.request_info")}
              </button>
              {showInfo && (
                <div className="mt-3 rounded-md bg-success/10 text-success-foreground px-2.5 py-1.5 text-xs">
                  ✓ {lang === "EN" ? "Auto-message sent to tenant — AI will follow up." : "Auto-Nachricht an Mieter:in gesendet – AI fragt nach."}
                </div>
              )}
            </div>

            {/* Urgency reasoning */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> {lang === "EN" ? "Why critical?" : "Begründung Dringlichkeit"}
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
                <li>• {lang === "EN" ? "Outside temp < 5 °C" : "Außentemperatur < 5 °C"}</li>
                <li>• {lang === "EN" ? "Entire apartment, not single room" : "Gesamte Wohnung, nicht Einzelraum"}</li>
                <li>• {lang === "EN" ? "Heating SLA 4h applies" : "SLA Heizung 4 Std. greift"}</li>
              </ul>
            </div>

            {/* Contractor recommendation */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Wrench className="h-3.5 w-3.5 text-primary" /> {lang === "EN" ? "Recommended contractor" : "Empfohlener Handwerker"}
              </div>
              <div className="mt-2 text-sm font-medium">{t.contractor ?? "Müller Heizung GmbH"}</div>
              <div className="text-[11px] text-muted-foreground">★ 4.9 · ETA 2 Std. · Top-Match nach Kategorie & Historie</div>
              <button onClick={() => setShowAssign(true)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                <CheckCheck className="h-3.5 w-3.5" /> {tr("act.assign")}
              </button>
            </div>

            {/* Tenant info compact */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="text-xs font-semibold mb-2">{tr("common.tenant")}</div>
              <div className="text-sm font-medium">{t.tenant.name}</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{t.tenant.building} · {t.tenant.apartment}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{t.tenant.phone}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showAssign && <AssignContractorModal category={t.category} onClose={() => setShowAssign(false)} />}
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-medium mt-0.5">{value}</div>
    </div>
  );
}
