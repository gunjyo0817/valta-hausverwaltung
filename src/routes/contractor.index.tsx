import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { UrgencyBadge, StatusBadge } from "@/components/Badges";
import { MapPin, Phone, Camera, CheckCircle2, MessageSquareText, Wrench, Clock, Star, Briefcase } from "lucide-react";
import { useAddDocumentMetadata, useTickets, useUpdateContractorJob } from "@/lib/api";
import { useMemo, useState } from "react";
import { demoUploadErrorMessage, demoUploadFiles, type DemoUploadedFile } from "@/lib/demoUpload";
import { isOpenTicket } from "@/lib/ticketStatus";

export const Route = createFileRoute("/contractor/")({ component: ContractorJobs });

function ContractorJobs() {
  const { t, lang } = useLang();
  const ticketsQuery = useTickets();
  const updateJob = useUpdateContractorJob();
  const addDocument = useAddDocumentMetadata();
  const tickets = ticketsQuery.data ?? [];
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [completionTicketId, setCompletionTicketId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [completionInvoice, setCompletionInvoice] = useState("");
  const [completionPhoto, setCompletionPhoto] = useState<DemoUploadedFile | null>(null);
  const jobs = useMemo(
    () => tickets.filter((tk) => tk.contractorId === "c1" && isOpenTicket(tk)),
    [tickets],
  );
  const dueThisWeek = jobs.filter((job) => Boolean(job.schedule?.scheduledFor)).length;
  const avgResponse = jobs.length > 0 ? "2.1h" : "0.0h";
  const rating = jobs.length > 0 ? "4.9" : "—";

  const act = async (ticketId: string, action: "accept" | "start" | "request_info" | "complete") => {
    const message = action === "request_info"
      ? (lang === "EN" ? "Please confirm access details and any special instructions." : "Bitte Zugangsdaten und besondere Hinweise bestätigen.")
      : undefined;
    const key = `${ticketId}:${action}`;
    setActiveAction(key);
    setActionError(null);
    setActionSuccess(null);
    try {
      await updateJob.mutateAsync({ data: { ticketId, action, message, role: "contractor" } });
      setActionSuccess(lang === "EN" ? "Job updated." : "Auftrag aktualisiert.");
    } catch (error) {
      console.error("Contractor job action failed", error);
      setActionError(
        error instanceof Error
          ? error.message
          : (lang === "EN" ? "The job action failed." : "Die Auftragsaktion ist fehlgeschlagen."),
      );
    } finally {
      setActiveAction(null);
    }
  };
  const isActing = (ticketId: string, action: string) => activeAction === `${ticketId}:${action}` && updateJob.isPending;
  const startCompletion = (ticketId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setCompletionTicketId((current) => current === ticketId ? null : ticketId);
    setCompletionNote("");
    setCompletionInvoice("");
    setCompletionPhoto(null);
  };
  const completeWithDetails = async (ticketId: string) => {
    if (updateJob.isPending || addDocument.isPending) return;
    const note = completionNote.trim();
    const invoice = completionInvoice.trim();
    const messageParts = [
      note || (lang === "EN" ? "Work completed." : "Arbeiten abgeschlossen."),
      invoice ? `${lang === "EN" ? "Invoice/reference" : "Rechnung/Referenz"}: ${invoice}` : null,
      completionPhoto ? `${lang === "EN" ? "Completion photo" : "Abschlussfoto"}: ${completionPhoto.name}` : null,
    ].filter(Boolean);
    const key = `${ticketId}:complete`;
    setActiveAction(key);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (completionPhoto) {
        await addDocument.mutateAsync({
          data: {
            scope: "ticket",
            targetId: ticketId,
            name: completionPhoto.name,
            type: completionPhoto.type,
            url: completionPhoto.url,
            role: "contractor",
          },
        });
      }
      await updateJob.mutateAsync({
        data: {
          ticketId,
          action: "complete",
          message: messageParts.join("\n"),
          role: "contractor",
        },
      });
      setCompletionTicketId(null);
      setCompletionNote("");
      setCompletionInvoice("");
      setCompletionPhoto(null);
      setActionSuccess(lang === "EN" ? "Job marked complete." : "Auftrag als abgeschlossen markiert.");
    } catch (error) {
      console.error("Contractor completion failed", error);
      setActionError(
        error instanceof Error
          ? error.message
          : demoUploadErrorMessage(error, lang),
      );
    } finally {
      setActiveAction(null);
    }
  };

  const kpi = [
    { label: t("cdash.kpi_active"), value: jobs.length, icon: Briefcase, color: "text-primary bg-primary/10" },
    { label: t("cdash.kpi_week"), value: dueThisWeek, icon: Clock, color: "text-info bg-info/10" },
    { label: t("cdash.kpi_avg"), value: avgResponse, icon: Wrench, color: "text-warning bg-warning/10" },
    { label: t("cdash.kpi_rating"), value: rating, icon: Star, color: "text-success bg-success/10" },
  ];

  return (
    <AppShell title={t("cdash.title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {ticketsQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Jobs could not be loaded" : "Auftraege konnten nicht geladen werden"}
            description={lang === "EN" ? "The contractor job read failed. This is different from an empty demo database." : "Die Abfrage der Handwerker-Auftraege ist fehlgeschlagen. Das ist etwas anderes als eine leere Demo-Datenbank."}
          />
        )}
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
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpi.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${k.color}`}><k.icon className="h-4 w-4" /></div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Jobs list */}
        <div className="space-y-3">
          {jobs.length === 0 && !ticketsQuery.isLoading && (
            <EmptyDataState
              title={lang === "EN" ? "No active contractor jobs" : "Keine aktiven Handwerker-Auftraege"}
              description={lang === "EN" ? "There are no active jobs assigned to this demo contractor. Reload mock data from the admin page to restore job records." : "Diesem Demo-Handwerker sind keine aktiven Auftraege zugewiesen. Lade Mock-Daten im Adminbereich neu, um Auftraege wiederherzustellen."}
            />
          )}
          {jobs.map((tk) => (
            <div key={tk.id} className="rounded-xl border border-border bg-surface overflow-hidden hover:shadow-soft transition-shadow">
              <div className="p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-muted-foreground">{tk.id}</span>
                      <UrgencyBadge urgency={tk.urgency} />
                      <StatusBadge status={tk.status} />
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold tracking-tight">{tk.title[lang]}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {tk.tenant.building} · {tk.tenant.apartment[lang]}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("cdash.eta")}</div>
                    <div className="text-sm font-semibold">{tk.schedule ? `${tk.schedule.dateLabel[lang]} · ${tk.schedule.timeLabel[lang]}` : "—"}</div>
                  </div>
                </div>

                <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border bg-accent/20 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("cdash.notes")}</div>
                    <p className="text-foreground">{tk.summary[lang]}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-accent/20 p-3 space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("cdash.tenant_contact")}</div>
                    <div className="font-medium text-foreground">{tk.tenant.name}</div>
                    <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {tk.tenant.phone}</div>
                    {tk.photos > 0 && <div className="flex items-center gap-1 text-muted-foreground"><Camera className="h-3 w-3" /> {tk.photos} {t("common.photos")}</div>}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => void act(tk.id, "accept")} disabled={updateJob.isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {isActing(tk.id, "accept") ? t("common.loading") : t("cdash.accept")}
                  </button>
                  <button onClick={() => void act(tk.id, "start")} disabled={updateJob.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition disabled:opacity-50">
                    <Wrench className="h-3.5 w-3.5" /> {isActing(tk.id, "start") ? t("common.loading") : t("cdash.start")}
                  </button>
                  <button onClick={() => void act(tk.id, "request_info")} disabled={updateJob.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition disabled:opacity-50">
                    <MessageSquareText className="h-3.5 w-3.5" /> {isActing(tk.id, "request_info") ? t("common.loading") : t("cdash.request_info")}
                  </button>
                  <button onClick={() => startCompletion(tk.id)} disabled={updateJob.isPending || addDocument.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition disabled:opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {isActing(tk.id, "complete") ? t("common.loading") : (lang === "EN" ? "Complete" : "Abschließen")}
                  </button>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(tk.tenant.building)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition ml-auto">
                    <MapPin className="h-3.5 w-3.5" /> {t("cdash.directions")}
                  </a>
                  <Link to="/ticket/$id" params={{ id: tk.id }} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent transition">
                    {t("act.open_ticket")}
                  </Link>
                </div>
                {completionTicketId === tk.id && (
                  <div className="mt-4 rounded-lg border border-border bg-background p-3">
                    <div className="text-xs font-semibold">{lang === "EN" ? "Completion details" : "Abschlussdetails"}</div>
                    <div className="mt-3 grid gap-3">
                      <textarea
                        value={completionNote}
                        onChange={(event) => setCompletionNote(event.target.value)}
                        placeholder={lang === "EN" ? "Work performed, access notes, or remaining observations" : "Durchgefuehrte Arbeiten, Zugangshinweise oder verbleibende Beobachtungen"}
                        className="h-24 w-full rounded-md border border-border bg-surface p-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                      />
                      <input
                        value={completionInvoice}
                        onChange={(event) => setCompletionInvoice(event.target.value)}
                        placeholder={lang === "EN" ? "Optional invoice or reference number" : "Optionale Rechnungs- oder Referenznummer"}
                        className="w-full rounded-md border border-border bg-surface px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                      />
                      <label className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
                        <span className="truncate">{completionPhoto ? completionPhoto.name : (lang === "EN" ? "Optional completion photo" : "Optionales Abschlussfoto")}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            void demoUploadFiles(event.target.files, { kind: "image", maxFiles: 1 })
                              .then((files) => {
                                setActionError(null);
                                setCompletionPhoto(files[0] ?? null);
                              })
                              .catch((error) => setActionError(demoUploadErrorMessage(error, lang)));
                          }}
                        />
                        <Camera className="h-3.5 w-3.5 shrink-0" />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => startCompletion(tk.id)}
                        disabled={updateJob.isPending || addDocument.isPending}
                        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                      >
                        {lang === "EN" ? "Cancel" : "Abbrechen"}
                      </button>
                      <button
                        onClick={() => void completeWithDetails(tk.id)}
                        disabled={updateJob.isPending || addDocument.isPending}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isActing(tk.id, "complete") || addDocument.isPending ? t("common.loading") : (lang === "EN" ? "Submit completion" : "Abschluss senden")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
