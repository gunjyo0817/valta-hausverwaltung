import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import {
  useApproveTicketReply,
  useGenerateReplyDraft,
  useGenerateSummary,
  useSuggestContractor,
  useTickets,
  type TicketDto,
} from "@/lib/api";
import {
  Search,
  Filter,
  Sparkles,
  Languages,
  CheckCheck,
  Pencil,
  Send,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildReplyDraft } from "@/lib/ticketCopy";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Operations Inbox · Valta" },
      { name: "description", content: "AI-prioritised inbox for property management with Copilot drafts, translation and approval." },
    ],
  }),
  component: InboxPage,
});

type FilterKey = "all" | "critical" | "new" | "waiting" | "in_progress" | "resolved";

function InboxPage() {
  const { t, lang } = useLang();
  const ticketsQuery = useTickets();
  const { data } = ticketsQuery;
  const tickets = data ?? [];
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [draftEdit, setDraftEdit] = useState(false);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "critical", label: t("filter.critical") },
    { key: "new", label: t("filter.new") },
    { key: "waiting", label: t("filter.waiting") },
    { key: "in_progress", label: t("filter.in_progress") },
    ...(showMoreFilters ? [{ key: "resolved" as const, label: lang === "EN" ? "Resolved" : "Erledigt" }] : []),
  ];

  const list = useMemo(() => {
    const filtered = (() => {
      if (filter === "all") return tickets;
      if (filter === "critical") return tickets.filter((tk) => tk.urgency === "critical" || tk.urgency === "high");
      if (filter === "new") return tickets.filter((tk) => tk.status === "new");
      if (filter === "waiting") return tickets.filter((tk) => tk.status === "waiting");
      if (filter === "resolved") return tickets.filter((tk) => tk.status === "resolved");
      return tickets.filter((tk) => tk.status === "in_progress");
    })();
    const term = query.trim().toLowerCase();
    if (!term) return filtered;
    return filtered.filter((tk) =>
      [
        tk.id,
        tk.title.DE,
        tk.title.EN,
        tk.tenant.name,
        tk.tenant.building,
        tk.tenant.apartment.DE,
        tk.tenant.apartment.EN,
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }, [filter, tickets, query]);

  const selected = tickets.find((tk) => tk.id === selectedId) ?? tickets[0];

  useEffect(() => {
    if (!selectedId && tickets.length > 0) {
      setSelectedId(tickets[0].id);
      return;
    }
    if (selectedId && tickets.length > 0 && !tickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(tickets[0].id);
    }
  }, [selectedId, tickets]);

  return (
    <AppShell title={t("inbox.title")} subtitle={t("inbox.sub")}>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_360px] h-[calc(100vh-4rem)]">
        <aside className="border-r border-border bg-surface flex flex-col min-h-0">
          {ticketsQuery.isError && (
            <div className="p-3">
              <DataErrorState
                title={lang === "EN" ? "Tickets could not be loaded" : "Tickets konnten nicht geladen werden"}
                description={lang === "EN" ? "The inbox request failed. This is different from an intentionally empty demo database." : "Die Inbox-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich geleerte Demo-Datenbank."}
                className="p-5"
              />
            </div>
          )}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("common.search_tickets")} className="w-full bg-transparent outline-none" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] border transition-colors",
                    filter === f.key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {f.label}
                </button>
              ))}
              <button onClick={() => setShowMoreFilters((value) => !value)} className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <Filter className="h-3 w-3" /> {t("common.more")}
              </button>
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-border">
            {list.length === 0 && (
              <li className="p-8 text-center text-xs text-muted-foreground">
                {tickets.length === 0 && !query && filter === "all" ? (
                  <EmptyDataState
                    title={lang === "EN" ? "No tickets in the database" : "Keine Tickets in der Datenbank"}
                    description={lang === "EN" ? "The demo data has been cleared. Reload mock data from the admin page to restore the inbox." : "Die Demo-Daten wurden geleert. Lade Mock-Daten im Adminbereich neu, um die Inbox wieder zu fuellen."}
                    className="border-0 bg-transparent p-0"
                  />
                ) : (
                  <>
                    <div className="font-medium text-sm text-foreground mb-1">{t("common.no_results")}</div>
                    {t("common.empty_sub")}
                  </>
                )}
              </li>
            )}
            {list.map((tk) => (
              <li key={tk.id}>
                <button
                  onClick={() => setSelectedId(tk.id)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-accent/40 transition-colors",
                    selectedId === tk.id && "bg-accent",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{tk.id}</span>
                    <UrgencyBadge urgency={tk.urgency} />
                    <span className="ml-auto text-[11px] text-muted-foreground">{tk.createdAt[lang]}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium truncate">{tk.title[lang]}</div>
                  <div className="text-xs text-muted-foreground truncate">{tk.tenant.name} · {tk.tenant.apartment[lang]}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={tk.status} />
                    <AIBadge confidence={tk.confidence} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="overflow-y-auto bg-background min-h-0">
          {selected ? (
            <TicketDetail ticket={selected} translated={translated} onTranslate={() => setTranslated((v) => !v)} />
          ) : (
            <div className="p-6 md:p-8">
              <EmptyDataState
                title={lang === "EN" ? "Select a ticket" : "Ticket auswaehlen"}
                description={lang === "EN" ? "There are no tickets to show. Use the demo data admin to reload mock records." : "Es gibt keine Tickets zum Anzeigen. Im Demo-Daten-Admin kannst du Mock-Datensaetze neu laden."}
              />
            </div>
          )}
        </section>

        <aside className="border-l border-border bg-surface overflow-y-auto min-h-0">
          {selected ? (
            <CopilotPanel ticket={selected} draftEdit={draftEdit} setDraftEdit={setDraftEdit} />
          ) : (
            <div className="p-4">
              <EmptyDataState
                title={lang === "EN" ? "Copilot is idle" : "Copilot wartet"}
                description={lang === "EN" ? "Copilot actions need a ticket record." : "Copilot-Aktionen benoetigen ein Ticket."}
                className="p-5"
              />
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function TicketDetail({ ticket, translated, onTranslate }: { ticket: TicketDto; translated: boolean; onTranslate: () => void }) {
  const { t, lang } = useLang();
  const generateSummary = useGenerateSummary();
  const suggestContractor = useSuggestContractor();
  const showLang = translated ? (lang === "DE" ? "EN" : "DE") : lang;
  const [summaryText, setSummaryText] = useState(ticket.summary[showLang]);
  const [summaryConfidence, setSummaryConfidence] = useState(ticket.confidence);
  const [contractorName, setContractorName] = useState(ticket.contractorName ?? "—");
  const [contractorReason, setContractorReason] = useState(t("inbox.recommended_basis"));

  useEffect(() => {
    let cancelled = false;

    setSummaryText(ticket.summary[showLang]);
    setSummaryConfidence(ticket.confidence);
    setContractorName(ticket.contractorName ?? "—");
    setContractorReason(t("inbox.recommended_basis"));

    generateSummary
      .mutateAsync({ data: { ticketId: ticket.id, language: showLang, ticket } })
      .then((result) => {
        if (!cancelled) {
          setSummaryText(result.summary);
          setSummaryConfidence(result.confidence);
        }
      })
      .catch(() => {});

    suggestContractor
      .mutateAsync({ data: { ticketId: ticket.id, category: ticket.category[lang], language: lang } })
      .then((result) => {
        if (!cancelled) {
          setContractorName(result.contractor || ticket.contractorName || "—");
          setContractorReason(result.reason || t("inbox.recommended_basis"));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [ticket.id, showLang, lang]);

  const photoAttachments = (ticket.attachments?.length ?? 0) > 0
    ? ticket.attachments!
    : Array.from({ length: ticket.photos }).map((_, index) => ({
        id: `${ticket.id}-placeholder-${index + 1}`,
        name: `Foto ${index + 1}`,
        type: "image",
        updated: ticket.createdAt[lang],
        url: null,
      }));
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/inbox" className="hover:text-foreground">{t("nav.inbox")}</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{ticket.id}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{ticket.title[showLang]}</h2>
          <UrgencyBadge urgency={ticket.urgency} />
          <StatusBadge status={ticket.status} />
          <AIBadge confidence={summaryConfidence} />
          <button
            onClick={onTranslate}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent"
          >
            <Languages className="h-3.5 w-3.5" /> {translated ? t("common.show_original") : t("common.show_en")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border ai-gradient p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("common.summary")}
        </div>
        <p className="mt-2 text-sm leading-relaxed">{summaryText}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard label={t("common.tenant")} value={ticket.tenant.name} sub={ticket.tenant.phone} />
        <InfoCard label={`${t("common.property")} / ${t("intake.unit")}`} value={ticket.tenant.apartment[lang]} sub={ticket.tenant.building} />
        <InfoCard label={t("common.category")} value={ticket.category[lang]} sub={`${t("common.language")} ${ticket.language}`} />
        <InfoCard label={t("inbox.recommended")} value={contractorName} sub={contractorReason} />
      </div>

      <section>
        <h3 className="text-sm font-semibold mb-2">{t("common.timeline")}</h3>
        <ol className="rounded-xl border border-border bg-surface divide-y divide-border">
          {ticket.history.map((h, i) => (
            <li key={i} className="flex gap-3 p-3 text-sm">
              {(() => {
                const delivery = h.type === "system" && (h.text.EN.startsWith("Delivery:") || h.text.DE.startsWith("Zustellung:"));
                return (
                  <>
              <span className="w-12 shrink-0 text-[11px] text-muted-foreground">{h.at[lang]}</span>
              <span className={cn(
                "rounded-md px-2 py-0.5 text-[11px] h-fit",
                h.type === "ai" && "bg-ai/10 text-ai",
                h.type === "tenant" && "bg-info/10 text-info-foreground",
                h.type === "manager" && "bg-primary/10 text-primary",
                h.type === "contractor" && "bg-success/15 text-success-foreground",
                delivery && "bg-warning/15 text-warning-foreground",
              )}>{delivery ? (lang === "EN" ? "Delivery" : "Zustellung") : h.type === "ai" ? t("common.ai") : h.type === "tenant" ? t("common.tenant") : h.type === "manager" ? t("common.manager") : h.type === "contractor" ? t("common.contractor") : "System"}</span>
              <p className="flex-1 leading-snug">{h.text[lang]}</p>
                  </>
                );
              })()}
            </li>
          ))}
        </ol>
      </section>

      {photoAttachments.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">{t("common.attached_photos")} ({photoAttachments.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {photoAttachments.map((attachment) => (
              <a key={attachment.id} href={attachment.url ?? undefined} className="aspect-video rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </section>
      )}

      <div>
        <Link to="/ticket/$id" params={{ id: ticket.id }} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          {t("act.open_ticket")} →
        </Link>
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function CopilotPanel({ ticket, draftEdit, setDraftEdit }: { ticket: TicketDto; draftEdit: boolean; setDraftEdit: (v: boolean) => void }) {
  const { t, lang } = useLang();
  const approveReply = useApproveTicketReply();
  const generateReply = useGenerateReplyDraft();
  const [sent, setSent] = useState(false);
  const draft = buildReplyDraft(ticket, lang);
  const [draftText, setDraftText] = useState(draft);
  const [draftConfidence, setDraftConfidence] = useState(94);

  useEffect(() => {
    let cancelled = false;
    setDraftText(draft);
    setDraftConfidence(94);
    setSent(false);

    generateReply
      .mutateAsync({ data: { ticketId: ticket.id, language: lang, ticket } })
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
  }, [draft, ticket.id, lang]);

  const submitReply = async () => {
    if (sent || approveReply.isPending) return;
    await approveReply.mutateAsync({ data: { ticketId: ticket.id, text: draftText } });
    setSent(true);
    setDraftEdit(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("copilot.title")}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{t("copilot.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border bg-background p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{t("copilot.reply_draft")}</span>
          <AIBadge confidence={draftConfidence} />
        </div>
        {draftEdit ? (
          <textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} className="w-full h-40 text-sm rounded-md border border-border bg-surface p-2 outline-none focus:ring-2 focus:ring-ring" />
        ) : (
          <pre className={cn("whitespace-pre-wrap font-sans text-sm leading-snug text-foreground/90", sent && "opacity-50")}>{draftText}</pre>
        )}
        <div className="flex flex-wrap gap-2">
          <button disabled={sent || approveReply.isPending} onClick={submitReply} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <CheckCheck className="h-3.5 w-3.5" /> {sent ? t("act.sent") : approveReply.isPending ? t("common.loading") : t("act.approve")}
          </button>
          <button onClick={() => setDraftEdit(!draftEdit)} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent">
            <Pencil className="h-3.5 w-3.5" /> {draftEdit ? t("act.done") : t("act.edit")}
          </button>
          <button disabled={approveReply.isPending} onClick={submitReply} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> {t("act.manual")}
          </button>
        </div>
      </div>

      <Link to="/ticket/$id" params={{ id: ticket.id }} className="block rounded-xl border border-border bg-background p-3 text-xs text-primary hover:bg-accent transition-colors">
        {t("act.open_ticket")} →
      </Link>
    </div>
  );
}
