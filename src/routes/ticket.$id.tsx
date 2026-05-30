import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import { getTicket } from "@/lib/mockData";
import { getProperty } from "@/lib/properties";
import {
  useAddDocumentMetadata,
  useApproveTicketReply,
  useDetectMissingInfo,
  useGenerateReplyDraft,
  useProperty,
  useRequestMissingInfo,
  useTicket,
} from "@/lib/api";
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
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/ticket/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Valta` },
      { name: "description", content: "AI-structured maintenance ticket with summary, contractor recommendation and history." },
    ],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { id } = useParams({ from: "/ticket/$id" });
  const { data: ticketData } = useTicket(id);
  const tk = ticketData ?? getTicket(id);
  const { data: propertyData } = useProperty(tk.propertyId);
  const prop = propertyData ?? getProperty(tk.propertyId);
  const { lang, t } = useLang();
  const [showAssign, setShowAssign] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [editDraft, setEditDraft] = useState(false);
  const [sent, setSent] = useState(false);
  const approveReply = useApproveTicketReply();
  const requestInfo = useRequestMissingInfo();
  const generateReply = useGenerateReplyDraft();
  const detectMissing = useDetectMissingInfo();
  const addDocument = useAddDocumentMetadata();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showLang = translated ? (lang === "DE" ? "EN" : "DE") : lang;

  const firstName = tk.tenant.name.split(" ")[0];
  const draft = lang === "EN"
    ? `Hi ${firstName},\n\nthanks for your report. We've dispatched an emergency technician — ETA today between 11:00 and 13:00. You'll get an update once they're on the way.\n\nBest\nYour property management`
    : `Hallo ${firstName},\n\nvielen Dank für Ihre Meldung. Wir haben einen Heizungsnotdienst beauftragt – ETA heute zwischen 11:00 und 13:00 Uhr. Sie erhalten ein Update, sobald der Techniker unterwegs ist.\n\nBeste Grüße\nIhre Hausverwaltung`;
  const [draftText, setDraftText] = useState(draft);

  useEffect(() => {
    let cancelled = false;
    setDraftText(draft);
    setSent(false);
    setShowInfo(false);

    generateReply
      .mutateAsync({ data: { ticketId: tk.id, language: lang } })
      .then((result) => {
        if (!cancelled) setDraftText(result.text);
      })
      .catch(() => {
        if (!cancelled) setDraftText(draft);
      });

    return () => {
      cancelled = true;
    };
  }, [draft, tk.id, lang]);

  const missingInfoText = lang === "EN"
    ? "Please send the exact thermostat model and confirm whether neighbours are affected."
    : "Bitte senden Sie den genauen Thermostat-Typ und bestätigen Sie, ob Nachbarn ebenfalls betroffen sind.";

  const submitReply = async () => {
    if (sent || approveReply.isPending) return;
    await approveReply.mutateAsync({ data: { ticketId: tk.id, text: draftText } });
    setSent(true);
    setEditDraft(false);
  };

  const submitMissingInfoRequest = async () => {
    if (showInfo || requestInfo.isPending || detectMissing.isPending) return;
    const aiMissingInfo = await detectMissing.mutateAsync({ data: { ticketId: tk.id, language: lang } });
    await requestInfo.mutateAsync({ data: { ticketId: tk.id, text: aiMissingInfo.text || missingInfoText } });
    setShowInfo(true);
  };
  const photoAttachments = (tk.attachments?.length ?? 0) > 0
    ? tk.attachments!
    : Array.from({ length: tk.photos }).map((_, index) => ({
        id: `${tk.id}-placeholder-${index + 1}`,
        name: `Foto ${index + 1}`,
        type: "image",
        updated: tk.createdAt[lang],
        url: null,
      }));

  const addAttachmentMetadata = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    await addDocument.mutateAsync({
      data: {
        scope: "ticket",
        targetId: tk.id,
        name: file.name,
        type: file.type || "image",
        role: "pm",
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AppShell title={`${tk.id} · ${tk.title[lang]}`} subtitle={`${tk.tenant.building} · ${tk.tenant.apartment[lang]}`}>
      <div className="p-4 md:p-8">
        <Link to="/inbox" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" /> {t("act.back_to_inbox")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <UrgencyBadge urgency={tk.urgency} />
                <StatusBadge status={tk.status} />
                <AIBadge confidence={tk.confidence} />
                <button onClick={() => setTranslated((v) => !v)} className="ml-auto inline-flex items-center gap-1.5 text-xs border border-border rounded-md px-2 py-1 hover:bg-accent">
                  <Languages className="h-3.5 w-3.5" /> {translated ? t("common.show_original") : t("common.show_en")}
                </button>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">{tk.title[showLang]}</h2>
              <div className="mt-4 rounded-xl ai-gradient p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("common.summary")}
                </div>
                <p className="mt-2 text-sm leading-relaxed">{tk.summary[showLang]}</p>
              </div>
              <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{tk.description[showLang]}</p>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Meta label={t("common.category")} value={tk.category[lang]} />
                <Meta label={t("common.since")} value={tk.createdAt[lang]} />
                <Meta label={t("common.language")} value={tk.tenant.language} />
                <Meta label={t("common.photos")} value={`${tk.photos}`} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquareText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("common.timeline")}</h3>
                <span className="ml-auto text-[11px] text-muted-foreground">{t("ticket.all_channels")}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{t("common.timeline_sub")}</p>
              <ol className="relative space-y-4 pl-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
                {tk.history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className={cn(
                      "absolute -left-[14px] top-1 h-3 w-3 rounded-full ring-4 ring-surface",
                      h.type === "ai" && "bg-ai",
                      h.type === "tenant" && "bg-info",
                      (h.type === "manager" || h.type === "system") && "bg-primary",
                      h.type === "contractor" && "bg-success",
                    )} />
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {h.type === "ai" ? <Bot className="h-3 w-3 text-ai" /> :
                        h.type === "tenant" ? <User className="h-3 w-3 text-info" /> :
                        h.type === "manager" || h.type === "system" ? <ShieldCheck className="h-3 w-3 text-primary" /> :
                        <HardHat className="h-3 w-3 text-success" />}
                      <span className="font-medium text-foreground">
                        {h.type === "ai" ? "Valta AI" : h.type === "tenant" ? tk.tenant.name : h.type === "manager" || h.type === "system" ? "Sarah Krüger" : (tk.contractorName ?? t("common.contractor"))}
                      </span>
                      <span>·</span>
                      <span>{h.at[lang]}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug">{h.text[lang]}</p>
                  </li>
                ))}
              </ol>
            </div>

            {photoAttachments.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => addAttachmentMetadata(event.target.files)} />
                <h3 className="text-sm font-semibold mb-3">{t("common.attached_photos")}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {photoAttachments.map((attachment) => (
                    <button key={attachment.id} onClick={() => attachment.url ? window.open(attachment.url, "_blank", "noopener,noreferrer") : fileInputRef.current?.click()} className="aspect-video rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 self-start">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("copilot.title")}
                <span className="ml-auto text-[10px] uppercase tracking-wider bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                  {t("copilot.suggests_approve")}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{t("copilot.reply_draft")}</span>
                <AIBadge confidence={94} />
              </div>
              {editDraft ? (
                <textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} className="w-full h-40 text-sm rounded-md border border-border bg-background p-2 outline-none focus:ring-2 focus:ring-ring" />
              ) : (
                <pre className={cn("whitespace-pre-wrap font-sans text-sm leading-snug text-foreground/90 transition-opacity", sent && "opacity-50")}>{draftText}</pre>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={sent || approveReply.isPending}
                  onClick={submitReply}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> {sent ? t("act.sent") : approveReply.isPending ? t("common.loading") : t("act.approve")}
                </button>
                <button onClick={() => setEditDraft((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent">
                  <Pencil className="h-3.5 w-3.5" /> {editDraft ? t("act.done") : t("act.edit")}
                </button>
                <button disabled={approveReply.isPending} onClick={submitReply} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
                  <Send className="h-3.5 w-3.5" /> {t("act.manual")}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" /> {t("copilot.missing_info")}
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
                <li>• {lang === "EN" ? "Exact thermostat model" : "Genauer Thermostat-Typ"}</li>
                <li>• {lang === "EN" ? "Confirmation: are neighbours affected?" : "Bestätigung: Sind Nachbarn betroffen?"}</li>
              </ul>
              <button disabled={showInfo || requestInfo.isPending} onClick={submitMissingInfoRequest} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
                <MessageSquareText className="h-3.5 w-3.5" /> {t("act.request_info")}
              </button>
              {showInfo && (
                <div className="mt-3 rounded-md bg-success/10 text-success-foreground px-2.5 py-1.5 text-xs">
                  ✓ {t("copilot.auto_sent")}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> {t("copilot.why_critical")}
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
                <li>• {lang === "EN" ? "Outside temp < 5 °C" : "Außentemperatur < 5 °C"}</li>
                <li>• {lang === "EN" ? "Entire apartment, not single room" : "Gesamte Wohnung, nicht Einzelraum"}</li>
                <li>• {lang === "EN" ? "Heating SLA 4 h applies" : "SLA Heizung 4 Std. greift"}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Wrench className="h-3.5 w-3.5 text-primary" /> {t("inbox.recommended")}
              </div>
              <div className="mt-2 text-sm font-medium">{tk.contractorName ?? "Müller Heizung GmbH"}</div>
              <div className="text-[11px] text-muted-foreground">★ 4.9 · ETA 2 {t("common.hours_short")} · {t("inbox.recommended_basis")}</div>
              <button onClick={() => setShowAssign(true)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                <CheckCheck className="h-3.5 w-3.5" /> {t("act.assign")}
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="text-xs font-semibold mb-2">{t("common.tenant")}</div>
              <div className="text-sm font-medium">{tk.tenant.name}</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{tk.tenant.building} · {tk.tenant.apartment[lang]}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{tk.tenant.phone}</div>
                <Link to="/properties/$id" params={{ id: prop.id }} className="flex items-center gap-2 text-primary hover:underline">
                  <Building2 className="h-3 w-3" />{prop.name}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showAssign && <AssignContractorModal ticketId={tk.id} category={tk.categoryKey} onClose={() => setShowAssign(false)} />}
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
