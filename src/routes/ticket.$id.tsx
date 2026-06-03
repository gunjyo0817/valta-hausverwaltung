import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import {
  useAddDocumentMetadata,
  useApproveTicketReply,
  useClassifyUrgency,
  useDetectMissingInfo,
  useGenerateReplyDraft,
  useGenerateSummary,
  useProperty,
  useRequestMissingInfo,
  useSuggestContractor,
  useTicket,
  useUpdateTicketStatus,
  type PropertyDto,
  type TicketDto,
  type TicketStatus,
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
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { demoUploadErrorMessage, demoUploadFiles } from "@/lib/demoUpload";
import { buildReplyDraft } from "@/lib/ticketCopy";

export const Route = createFileRoute("/ticket/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Valta` },
      { name: "description", content: "AI-structured maintenance ticket with summary, contractor recommendation and history." },
    ],
  }),
  component: TicketPage,
});

const statusTransitions: Record<TicketStatus, TicketStatus[]> = {
  new: ["waiting", "contractor_assigned", "in_progress", "resolved"],
  waiting: ["new", "in_progress", "resolved"],
  contractor_assigned: ["in_progress", "waiting", "resolved"],
  in_progress: ["waiting", "resolved"],
  resolved: ["in_progress"],
};

function statusActionLabel(status: TicketStatus, lang: "DE" | "EN") {
  const labels: Record<TicketStatus, Record<"DE" | "EN", string>> = {
    new: { DE: "Neu setzen", EN: "Set new" },
    waiting: { DE: "Info anfragen", EN: "Request info" },
    contractor_assigned: { DE: "Handwerker gesetzt", EN: "Contractor assigned" },
    in_progress: { DE: "In Bearbeitung", EN: "In progress" },
    resolved: { DE: "Als erledigt markieren", EN: "Mark resolved" },
  };
  return labels[status][lang];
}

function TicketPage() {
  const { id } = useParams({ from: "/ticket/$id" });
  const ticketQuery = useTicket(id);
  const tk = ticketQuery.data;
  const propertyQuery = useProperty(tk?.propertyId ?? "");
  const prop = propertyQuery.data;
  const { lang, t } = useLang();
  if (ticketQuery.isError || propertyQuery.isError) {
    return (
      <AppShell title={lang === "EN" ? "Ticket unavailable" : "Ticket nicht verfuegbar"}>
        <div className="p-4 md:p-8">
          <DataErrorState
            title={lang === "EN" ? "Ticket data could not be loaded" : "Ticketdaten konnten nicht geladen werden"}
            description={lang === "EN" ? "The backend read failed. This is different from an intentionally empty demo database." : "Die Backend-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich geleerte Demo-Datenbank."}
          />
        </div>
      </AppShell>
    );
  }

  if (!tk) {
    return (
      <AppShell title={ticketQuery.isLoading ? "Loading" : "Not found"}>
        <div className="p-4 md:p-8">
          <EmptyDataState
            title={ticketQuery.isLoading ? (lang === "EN" ? "Loading ticket" : "Ticket wird geladen") : (lang === "EN" ? "Ticket not found" : "Ticket nicht gefunden")}
            description={ticketQuery.isLoading ? (lang === "EN" ? "Waiting for the backend response." : "Warte auf die Backend-Antwort.") : (lang === "EN" ? "This ticket record is not present in the database. It may have been cleared from the demo data." : "Dieser Ticket-Datensatz ist nicht in der Datenbank vorhanden. Er wurde moeglicherweise aus den Demo-Daten geloescht.")}
          />
        </div>
      </AppShell>
    );
  }

  return <TicketContent tk={tk} prop={prop} />;
}

function TicketContent({ tk, prop }: { tk: TicketDto; prop?: PropertyDto | null }) {
  const { lang, t } = useLang();
  const [showAssign, setShowAssign] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [editDraft, setEditDraft] = useState(false);
  const [sent, setSent] = useState(false);
  const approveReply = useApproveTicketReply();
  const requestInfo = useRequestMissingInfo();
  const updateStatus = useUpdateTicketStatus();
  const classifyUrgency = useClassifyUrgency();
  const generateReply = useGenerateReplyDraft();
  const generateSummary = useGenerateSummary();
  const detectMissing = useDetectMissingInfo();
  const suggestContractor = useSuggestContractor();
  const addDocument = useAddDocumentMetadata();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showLang = translated ? (lang === "DE" ? "EN" : "DE") : lang;
  const defaultMissingInfoText = lang === "EN"
    ? "Please send the exact thermostat model and confirm whether neighbours are affected."
    : "Bitte senden Sie den genauen Thermostat-Typ und bestätigen Sie, ob Nachbarn ebenfalls betroffen sind.";
  const defaultMissingInfoItems = lang === "EN"
    ? ["Exact thermostat model", "Confirmation: are neighbours affected?"]
    : ["Genauer Thermostat-Typ", "Bestätigung: Sind Nachbarn betroffen?"];
  const defaultUrgencyReasons = lang === "EN"
    ? ["Outside temp < 5 °C", "Entire apartment, not single room", "Heating SLA 4 h applies"]
    : ["Außentemperatur < 5 °C", "Gesamte Wohnung, nicht Einzelraum", "SLA Heizung 4 Std. greift"];

  const draft = buildReplyDraft(tk, lang);
  const [draftText, setDraftText] = useState(draft);
  const [draftConfidence, setDraftConfidence] = useState(94);
  const [summaryText, setSummaryText] = useState(tk.summary[showLang]);
  const [summaryConfidence, setSummaryConfidence] = useState(tk.confidence);
  const [missingInfoText, setMissingInfoText] = useState(defaultMissingInfoText);
  const [missingInfoItems, setMissingInfoItems] = useState(defaultMissingInfoItems);
  const [urgencyReasons, setUrgencyReasons] = useState(defaultUrgencyReasons);
  const [contractorName, setContractorName] = useState(tk.contractorName ?? "—");
  const [contractorReason, setContractorReason] = useState(t("inbox.recommended_basis"));
  const [contractorConfidence, setContractorConfidence] = useState(tk.confidence);
  const [statusNote, setStatusNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDraftText(draft);
    setDraftConfidence(94);
    setSent(false);
    setShowInfo(false);

    generateReply
      .mutateAsync({ data: { ticketId: tk.id, language: lang, ticket: tk } })
      .then((result) => {
        if (!cancelled) {
          setDraftText(result.text);
          setDraftConfidence(result.confidence);
        }
      })
      .catch(() => {
        if (!cancelled) setDraftText(draft);
      });

    return () => {
      cancelled = true;
    };
  }, [draft, tk.id, lang]);

  useEffect(() => {
    let cancelled = false;

    setSummaryText(tk.summary[showLang]);
    setSummaryConfidence(tk.confidence);
    setMissingInfoText(defaultMissingInfoText);
    setMissingInfoItems(defaultMissingInfoItems);
    setUrgencyReasons(defaultUrgencyReasons);
    setContractorName(tk.contractorName ?? "—");
    setContractorReason(t("inbox.recommended_basis"));
    setContractorConfidence(tk.confidence);

    generateSummary
      .mutateAsync({ data: { ticketId: tk.id, language: showLang, ticket: tk } })
      .then((result) => {
        if (!cancelled) {
          setSummaryText(result.summary);
          setSummaryConfidence(result.confidence);
        }
      })
      .catch(() => {});

    detectMissing
      .mutateAsync({ data: { ticketId: tk.id, language: lang, ticket: tk } })
      .then((result) => {
        if (!cancelled) {
          setMissingInfoText(result.text);
          setMissingInfoItems(result.items.length > 0 ? result.items : defaultMissingInfoItems);
        }
      })
      .catch(() => {});

    classifyUrgency
      .mutateAsync({
        data: {
          ticketId: tk.id,
          text: `${tk.title[lang]}\n${tk.summary[lang]}\n${tk.description[lang]}`,
          language: lang,
        },
      })
      .then((result) => {
        if (!cancelled) setUrgencyReasons(result.reasons.length > 0 ? result.reasons : defaultUrgencyReasons);
      })
      .catch(() => {});

    suggestContractor
      .mutateAsync({ data: { ticketId: tk.id, category: tk.category[lang], language: lang } })
      .then((result) => {
        if (!cancelled) {
          setContractorName(result.contractor || tk.contractorName || "—");
          setContractorReason(result.reason || t("inbox.recommended_basis"));
          setContractorConfidence(result.confidence);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [tk.id, showLang, lang]);

  const submitReply = async () => {
    if (sent || approveReply.isPending) return;
    setActionError(null);
    try {
      await approveReply.mutateAsync({ data: { ticketId: tk.id, text: draftText } });
      setSent(true);
      setEditDraft(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (lang === "EN" ? "The reply could not be sent." : "Die Antwort konnte nicht gesendet werden."));
    }
  };

  const submitMissingInfoRequest = async () => {
    if (showInfo || requestInfo.isPending || detectMissing.isPending) return;
    setActionError(null);
    try {
      await requestInfo.mutateAsync({ data: { ticketId: tk.id, text: missingInfoText || defaultMissingInfoText } });
      setShowInfo(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (lang === "EN" ? "The information request could not be sent." : "Die Informationsanfrage konnte nicht gesendet werden."));
    }
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
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    setActionError(null);
    setUploadMessage(null);
    try {
      const uploaded = await demoUploadFiles(selected, { kind: "image" });
      for (const file of uploaded) {
        await addDocument.mutateAsync({
          data: {
            scope: "ticket",
            targetId: tk.id,
            name: file.name,
            type: file.type,
            url: file.url,
            role: "pm",
          },
        });
      }
      setUploadMessage(lang === "EN" ? "Photo uploaded." : "Foto hochgeladen.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setActionError(demoUploadErrorMessage(error, lang));
    }
  };

  const updateManualStatus = async (status: TicketStatus) => {
    if (updateStatus.isPending) return;
    setActionError(null);
    setStatusMessage(null);
    try {
      await updateStatus.mutateAsync({
        data: {
          ticketId: tk.id,
          status,
          note: statusNote.trim() || undefined,
          role: "pm",
        },
      });
      setStatusNote("");
      setStatusMessage(lang === "EN" ? "Ticket status updated." : "Ticketstatus aktualisiert.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (lang === "EN" ? "The status could not be updated." : "Der Status konnte nicht aktualisiert werden."));
    }
  };

  const regenerateSummary = async () => {
    const result = await generateSummary.mutateAsync({ data: { ticketId: tk.id, language: showLang, ticket: tk, regenerate: true } });
    setSummaryText(result.summary);
    setSummaryConfidence(result.confidence);
  };

  const regenerateReply = async () => {
    const result = await generateReply.mutateAsync({ data: { ticketId: tk.id, language: lang, ticket: tk, regenerate: true } });
    setDraftText(result.text);
    setDraftConfidence(result.confidence);
    setSent(false);
  };

  const regenerateMissingInfo = async () => {
    const result = await detectMissing.mutateAsync({ data: { ticketId: tk.id, language: lang, ticket: tk, regenerate: true } });
    setMissingInfoText(result.text);
    setMissingInfoItems(result.items.length > 0 ? result.items : defaultMissingInfoItems);
  };

  const regenerateContractor = async () => {
    const result = await suggestContractor.mutateAsync({ data: { ticketId: tk.id, category: tk.category[lang], language: lang, regenerate: true } });
    setContractorName(result.contractor || tk.contractorName || "—");
    setContractorReason(result.reason || t("inbox.recommended_basis"));
    setContractorConfidence(result.confidence);
  };

  return (
    <AppShell title={`${tk.id} · ${tk.title[lang]}`} subtitle={`${tk.tenant.building} · ${tk.tenant.apartment[lang]}`}>
      <div className="p-4 md:p-8">
        <Link to="/inbox" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" /> {t("act.back_to_inbox")}
        </Link>
        {actionError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {lang === "EN" ? "Action failed: " : "Aktion fehlgeschlagen: "}
            <span className="font-medium">{actionError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <UrgencyBadge urgency={tk.urgency} />
                <StatusBadge status={tk.status} />
                <AIBadge confidence={summaryConfidence} />
                <button onClick={() => setTranslated((v) => !v)} className="ml-auto inline-flex items-center gap-1.5 text-xs border border-border rounded-md px-2 py-1 hover:bg-accent">
                  <Languages className="h-3.5 w-3.5" /> {translated ? t("common.show_original") : t("common.show_en")}
                </button>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">{tk.title[showLang]}</h2>
              <div className="mt-4 rounded-xl ai-gradient p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("common.summary")}
                  <button
                    disabled={generateSummary.isPending}
                    onClick={regenerateSummary}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-background/70 px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" /> {lang === "EN" ? "Regenerate" : "Neu generieren"}
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{summaryText}</p>
              </div>
              <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{tk.description[showLang]}</p>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Meta label={t("common.category")} value={tk.category[lang]} />
                <Meta label={t("common.since")} value={tk.createdAt[lang]} />
                <Meta label={t("common.language")} value={tk.tenant.language} />
                <Meta label={t("common.eta")} value={tk.schedule ? `${tk.schedule.dateLabel[lang]} · ${tk.schedule.timeLabel[lang]}` : "—"} />
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
                    {(() => {
                      const delivery = h.type === "system" && (h.text.EN.startsWith("Delivery:") || h.text.DE.startsWith("Zustellung:"));
                      return (
                        <>
                    <span className={cn(
                      "absolute -left-[14px] top-1 h-3 w-3 rounded-full ring-4 ring-surface",
                      h.type === "ai" && "bg-ai",
                      h.type === "tenant" && "bg-info",
                      (h.type === "manager" || (h.type === "system" && !delivery)) && "bg-primary",
                      h.type === "contractor" && "bg-success",
                      delivery && "bg-warning",
                    )} />
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {delivery ? <Send className="h-3 w-3 text-warning" /> :
                        h.type === "ai" ? <Bot className="h-3 w-3 text-ai" /> :
                        h.type === "tenant" ? <User className="h-3 w-3 text-info" /> :
                        h.type === "manager" || h.type === "system" ? <ShieldCheck className="h-3 w-3 text-primary" /> :
                        <HardHat className="h-3 w-3 text-success" />}
                      <span className="font-medium text-foreground">
                        {delivery ? (lang === "EN" ? "Delivery" : "Zustellung") : h.type === "ai" ? "Valta AI" : h.type === "tenant" ? tk.tenant.name : h.type === "manager" || h.type === "system" ? "Sarah Krüger" : (tk.contractorName ?? t("common.contractor"))}
                      </span>
                      <span>·</span>
                      <span>{h.at[lang]}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug">{h.text[lang]}</p>
                        </>
                      );
                    })()}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void addAttachmentMetadata(event.target.files)} />
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{t("common.attached_photos")}</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={addDocument.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {addDocument.isPending ? t("common.loading") : (lang === "EN" ? "Upload" : "Hochladen")}
                </button>
              </div>
              {uploadMessage && <div className="mb-3 rounded-md bg-success/10 px-2.5 py-1.5 text-xs text-success-foreground">{uploadMessage}</div>}
              <div className="grid grid-cols-3 gap-2">
                {photoAttachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url ?? undefined}
                    target={attachment.url ? "_blank" : undefined}
                    rel="noreferrer"
                    onClick={(event) => {
                      if (!attachment.url) {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="aspect-video overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    {attachment.url && attachment.type.startsWith("image") ? (
                      <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </a>
                ))}
                {photoAttachments.length === 0 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:bg-accent"
                  >
                    {lang === "EN" ? "Add photo" : "Foto hinzufuegen"}
                  </button>
                )}
              </div>
            </div>
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
                <div className="flex items-center gap-2">
                  <AIBadge confidence={draftConfidence} />
                  <button disabled={generateReply.isPending} onClick={regenerateReply} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50">
                    <RefreshCw className="h-3 w-3" /> {lang === "EN" ? "Regenerate" : "Neu"}
                  </button>
                </div>
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
                <button disabled={detectMissing.isPending} onClick={regenerateMissingInfo} className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50">
                  <RefreshCw className="h-3 w-3" /> {lang === "EN" ? "Regenerate" : "Neu"}
                </button>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
                {missingInfoItems.map((item) => <li key={item}>• {item}</li>)}
              </ul>
              <button disabled={showInfo || requestInfo.isPending || detectMissing.isPending} onClick={submitMissingInfoRequest} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
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
                {urgencyReasons.map((reason) => <li key={reason}>• {reason}</li>)}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Wrench className="h-3.5 w-3.5 text-primary" /> {t("inbox.recommended")}
                <button disabled={suggestContractor.isPending} onClick={regenerateContractor} className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50">
                  <RefreshCw className="h-3 w-3" /> {lang === "EN" ? "Regenerate" : "Neu"}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium">{contractorName}</span>
                <AIBadge confidence={contractorConfidence} />
              </div>
              <div className="text-[11px] text-muted-foreground">★ 4.9 · ETA 2 {t("common.hours_short")} · {contractorReason}</div>
              <button onClick={() => setShowAssign(true)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                <CheckCheck className="h-3.5 w-3.5" /> {t("act.assign")}
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold">{lang === "EN" ? "Manual status" : "Manueller Status"}</div>
                <StatusBadge status={tk.status} />
              </div>
              <textarea
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
                placeholder={lang === "EN" ? "Optional internal note" : "Optionale interne Notiz"}
                className="h-20 w-full rounded-md border border-border bg-background p-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="grid gap-2">
                {statusTransitions[tk.status].filter((status) => status !== "contractor_assigned" || Boolean(tk.contractorId)).map((status) => (
                  <button
                    key={status}
                    disabled={updateStatus.isPending}
                    onClick={() => updateManualStatus(status)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    {updateStatus.isPending ? t("common.loading") : statusActionLabel(status, lang)}
                  </button>
                ))}
              </div>
              {statusMessage && <div className="rounded-md bg-success/10 px-2.5 py-1.5 text-xs text-success-foreground">{statusMessage}</div>}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
              <div className="text-xs font-semibold mb-2">{t("common.tenant")}</div>
              <div className="text-sm font-medium">{tk.tenant.name}</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{tk.tenant.building} · {tk.tenant.apartment[lang]}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{tk.tenant.phone}</div>
                {prop ? (
                  <Link to="/properties/$id" params={{ id: prop.id }} className="flex items-center gap-2 text-primary hover:underline">
                    <Building2 className="h-3 w-3" />{prop.name}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />{lang === "EN" ? "Property record unavailable" : "Objekt-Datensatz nicht verfuegbar"}
                  </div>
                )}
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
