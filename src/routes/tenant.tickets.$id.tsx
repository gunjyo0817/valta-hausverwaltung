import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { StatusBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Circle, Clock, Image as ImageIcon, MessageSquareText, Phone, Sparkles, Wrench, Bell } from "lucide-react";
import { useAddDocumentMetadata, useAddTicketEvent, useTicket } from "@/lib/api";
import { demoUploadErrorMessage, demoUploadFiles } from "@/lib/demoUpload";

export const Route = createFileRoute("/tenant/tickets/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Request ${params.id} · Valta` },
      { name: "description", content: "Track your maintenance request in real time." },
    ],
  }),
  notFoundComponent: () => (
    <AppShell title="Not found">
      <div className="max-w-md mx-auto p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">This request does not exist.</p>
        <Link to="/tenant/tickets" className="text-primary hover:underline text-sm">Back to my requests</Link>
      </div>
    </AppShell>
  ),
  component: TicketTrackingPage,
});

function TicketTrackingPage() {
  const { id } = Route.useParams();
  const ticketQuery = useTicket(id);
  const { data: ticket } = ticketQuery;
  const { t, lang } = useLang();
  const addDocument = useAddDocumentMetadata();
  const addEvent = useAddTicketEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyText, setReplyText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (ticketQuery.isError) {
    return (
      <AppShell title="Not found">
        <div className="max-w-2xl mx-auto p-8">
          <DataErrorState
            title={lang === "EN" ? "Request could not be loaded" : "Anfrage konnte nicht geladen werden"}
            description={lang === "EN" ? "The backend read failed. This is different from an empty demo database." : "Die Backend-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine leere Demo-Datenbank."}
          />
        </div>
      </AppShell>
    );
  }

  if (!ticket) {
    return (
      <AppShell title="Not found">
        <div className="max-w-2xl mx-auto p-8">
          <EmptyDataState
            title={ticketQuery.isLoading ? (lang === "EN" ? "Loading request" : "Anfrage wird geladen") : (lang === "EN" ? "Request not found" : "Anfrage nicht gefunden")}
            description={ticketQuery.isLoading ? (lang === "EN" ? "Waiting for the backend response." : "Warte auf die Backend-Antwort.") : (lang === "EN" ? "This request is not present in the database. It may have been cleared from the demo data." : "Diese Anfrage ist nicht in der Datenbank vorhanden. Sie wurde moeglicherweise aus den Demo-Daten geloescht.")}
          />
          <div className="mt-4 text-center">
            <Link to="/tenant/tickets" className="text-primary hover:underline text-sm">Back to my requests</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Derive steps from current ticket status
  const order: Record<string, number> = { new: 1, waiting: 2, contractor_assigned: 3, in_progress: 4, resolved: 5 };
  const reached = order[ticket.status] ?? 1;
  const steps = (lang === "EN"
    ? [
        { label: "Received", at: ticket.createdAt.EN, desc: "Your report was captured and structured by Valta.", ai: true },
        { label: "Reviewed by property management", at: "—", desc: "We confirmed the details and determined the appropriate response." },
        { label: "Contractor dispatched", at: ticket.schedule?.dateLabel.EN ?? "—", desc: ticket.contractorName ? `${ticket.contractorName} assigned.` : "Selecting the right contractor." },
        { label: "Technician on the way", at: ticket.schedule ? `${ticket.schedule.timeLabel.EN} - ${ticket.schedule.endTimeLabel.EN}` : "ETA —", desc: "You'll be notified the moment the technician arrives." },
        { label: "Repair completed", at: "—", desc: "Please confirm once the issue is resolved." },
      ]
    : [
        { label: "Eingegangen", at: ticket.createdAt.DE, desc: "Ihre Meldung wurde von Valta erfasst und strukturiert.", ai: true },
        { label: "Von Hausverwaltung geprüft", at: "—", desc: "Wir haben die Angaben bestätigt und die passende Reaktion festgelegt." },
        { label: "Handwerker beauftragt", at: ticket.schedule?.dateLabel.DE ?? "—", desc: ticket.contractorName ? `${ticket.contractorName} beauftragt.` : "Passender Handwerker wird ausgewaehlt." },
        { label: "Techniker unterwegs", at: ticket.schedule ? `${ticket.schedule.timeLabel.DE} - ${ticket.schedule.endTimeLabel.DE}` : "ETA —", desc: "Sie erhalten eine Benachrichtigung, sobald der Techniker eintrifft." },
        { label: "Reparatur abgeschlossen", at: "—", desc: "Bitte bestätigen Sie nach Abschluss die Behebung." },
      ]
  ).map((s, idx) => ({ ...s, done: idx + 1 < reached, current: idx + 1 === reached }));

  const statusLabel = ticket.status === "resolved"
    ? (lang === "EN" ? "Resolved" : "Erledigt")
    : (lang === "EN" ? "We're on it" : "Wir kümmern uns");
  const attachments = (ticket.attachments?.length ?? 0) > 0
    ? ticket.attachments!
    : Array.from({ length: ticket.photos }).map((_, index) => ({
        id: `${ticket.id}-placeholder-${index + 1}`,
        name: `Foto ${index + 1}`,
        type: "image",
        updated: ticket.createdAt[lang],
        url: null,
      }));
  const addAttachmentMetadata = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const uploaded = await demoUploadFiles(selected, { kind: "image" });
      for (const file of uploaded) {
        await addDocument.mutateAsync({
          data: {
            scope: "ticket",
            targetId: ticket.id,
            name: file.name,
            type: file.type,
            url: file.url,
            role: "tenant",
          },
        });
      }
      setActionSuccess(lang === "EN" ? "Photo uploaded." : "Foto hochgeladen.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setActionError(demoUploadErrorMessage(error, lang));
    }
  };
  const sendTenantReply = async () => {
    const text = replyText.trim();
    if (!text || addEvent.isPending) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await addEvent.mutateAsync({
        data: {
          ticketId: ticket.id,
          type: "tenant",
          text,
          role: "tenant",
          status: ticket.status === "waiting" ? "in_progress" : undefined,
        },
      });
      setReplyText("");
      setActionSuccess(lang === "EN" ? "Your update was sent." : "Ihre Rueckmeldung wurde gesendet.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (lang === "EN" ? "The update could not be sent." : "Die Rueckmeldung konnte nicht gesendet werden."));
    }
  };
  const confirmResolved = async () => {
    if (addEvent.isPending) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await addEvent.mutateAsync({
        data: {
          ticketId: ticket.id,
          type: "tenant",
          text: lang === "EN" ? "Tenant confirmed that the issue is resolved." : "Mieter hat bestaetigt, dass das Problem behoben ist.",
          role: "tenant",
          status: "resolved",
        },
      });
      setActionSuccess(lang === "EN" ? "Resolution confirmed." : "Erledigung bestaetigt.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (lang === "EN" ? "The confirmation could not be sent." : "Die Bestaetigung konnte nicht gesendet werden."));
    }
  };
  const requestNotificationPermission = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    void Notification.requestPermission();
  };

  return (
    <AppShell title={ticket.title[lang]} subtitle={`${ticket.id} · ${ticket.category[lang]}`}>
      <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
        <Link to="/tenant/tickets" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-3.5 w-3.5" /> {lang === "EN" ? "All requests" : "Alle Anfragen"}
        </Link>
        {actionError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {lang === "EN" ? "Action failed: " : "Aktion fehlgeschlagen: "}
            <span className="font-medium">{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-foreground">
            {actionSuccess}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">{t("portal.case")} {ticket.id}</div>
              <h1 className="text-lg font-semibold tracking-tight">{ticket.title[lang]}</h1>
              <p className="text-sm text-muted-foreground mt-1">{ticket.summary[lang]}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={ticket.status} />
              <span className="text-[11px] rounded-full bg-success/15 text-success px-2 py-1 font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3" /> {statusLabel}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label={t("portal.assigned_contractor")} value={ticket.contractorName ?? "—"} />
            <Stat label={t("common.eta")} value={ticket.schedule ? `${ticket.schedule.dateLabel[lang]} · ${ticket.schedule.timeLabel[lang]}` : "—"} />
            <Stat label={lang === "EN" ? "Apartment" : "Wohnung"} value={ticket.tenant.apartment[lang]} />
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <h2 className="text-sm font-semibold mb-4">{t("portal.progress")}</h2>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {s.done ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : s.current ? (
                    <span className="relative flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-5 w-5 rounded-full bg-primary/30 animate-ping" />
                      <span className="relative h-3 w-3 rounded-full bg-primary" />
                    </span>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                  {i < steps.length - 1 && <span className={cn("w-px flex-1 my-1", s.done ? "bg-success/50" : "bg-border")} />}
                </div>
                <div className="pb-5 -mt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", !s.done && !s.current && "text-muted-foreground")}>{s.label}</span>
                    {s.ai && <span className="text-[10px] rounded bg-ai/10 text-ai px-1.5 py-0.5 flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />AI</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.at}</div>
                  <div className="text-xs text-foreground/70 mt-1 max-w-md">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">
              {ticket.status === "waiting"
                ? (lang === "EN" ? "Send requested information" : "Angeforderte Informationen senden")
                : (lang === "EN" ? "Send an update" : "Rueckmeldung senden")}
            </h2>
          </div>
          <textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder={ticket.status === "waiting"
              ? (lang === "EN" ? "Add access details, missing photos, or answers requested by property management." : "Ergaenzen Sie Zugangsdaten, fehlende Fotos oder Antworten der Hausverwaltung.")
              : (lang === "EN" ? "Add a short update for property management." : "Senden Sie eine kurze Rueckmeldung an die Hausverwaltung.")}
            className="h-28 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={replyText.trim().length === 0 || addEvent.isPending}
              onClick={sendTenantReply}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              {addEvent.isPending ? t("common.loading") : (lang === "EN" ? "Send update" : "Rueckmeldung senden")}
            </button>
            {ticket.status === "resolved" && (
              <button
                disabled={addEvent.isPending}
                onClick={confirmResolved}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {lang === "EN" ? "Confirm resolved" : "Erledigung bestaetigen"}
              </button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">{t("portal.updates")}</h2>
            </div>
            <ul className="space-y-3">
              {ticket.history.map((u: typeof ticket.history[number], i: number) => (
                <li key={i} className="text-sm">
                  {(() => {
                    const delivery = u.type === "system" && (u.text.EN.startsWith("Delivery:") || u.text.DE.startsWith("Zustellung:"));
                    return (
                      <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-muted-foreground">{u.at[lang]}</span>
                    <span className="text-xs font-medium capitalize">{delivery ? (lang === "EN" ? "delivery" : "zustellung") : u.type}</span>
                  </div>
                  <p className="leading-snug text-foreground/80">{u.text[lang]}</p>
                      </>
                    );
                  })()}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">{t("portal.attachments")}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url ?? undefined}
                  target={attachment.url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="aspect-square overflow-hidden rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground"
                >
                  {attachment.url && attachment.type.startsWith("image") ? (
                    <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </a>
              ))}
              {attachments.length === 0 && (
                <div className="aspect-square rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void addAttachmentMetadata(event.target.files)} />
              <button onClick={() => fileInputRef.current?.click()} disabled={addDocument.isPending} className="aspect-square rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:bg-accent disabled:opacity-50">
                {addDocument.isPending ? t("common.loading") : t("portal.add_photo")}
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <a href={`tel:${ticket.tenant.phone}`} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                <Phone className="h-3.5 w-3.5" /> {t("portal.contact_pm")}
              </a>
              <button onClick={requestNotificationPermission} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                <Bell className="h-3.5 w-3.5" /> {t("portal.notifications")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
