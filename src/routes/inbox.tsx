import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, UrgencyBadge, AIBadge } from "@/components/Badges";
import { tickets as mockTickets } from "@/lib/mockData";
import { useLang } from "@/lib/i18n";
import { useApproveTicketReply, useTickets, type TicketDto } from "@/lib/api";
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

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Operations Inbox · Valta" },
      { name: "description", content: "AI-prioritised inbox for property management with Copilot drafts, translation and approval." },
    ],
  }),
  component: InboxPage,
});

type FilterKey = "all" | "critical" | "new" | "waiting" | "in_progress";

function InboxPage() {
  const { t, lang } = useLang();
  const { data } = useTickets();
  const tickets = data ?? mockTickets;
  const [selectedId, setSelectedId] = useState(mockTickets[0].id);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [translated, setTranslated] = useState(false);
  const [draftEdit, setDraftEdit] = useState(false);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "critical", label: t("filter.critical") },
    { key: "new", label: t("filter.new") },
    { key: "waiting", label: t("filter.waiting") },
    { key: "in_progress", label: t("filter.in_progress") },
  ];

  const list = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "critical") return tickets.filter((tk) => tk.urgency === "critical" || tk.urgency === "high");
    if (filter === "new") return tickets.filter((tk) => tk.status === "new");
    if (filter === "waiting") return tickets.filter((tk) => tk.status === "waiting");
    return tickets.filter((tk) => tk.status === "in_progress");
  }, [filter, tickets]);

  const selected = tickets.find((tk) => tk.id === selectedId) ?? tickets[0];

  return (
    <AppShell title={t("inbox.title")} subtitle={t("inbox.sub")}>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_360px] h-[calc(100vh-4rem)]">
        <aside className="border-r border-border bg-surface flex flex-col min-h-0">
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder={t("common.search_tickets")} className="w-full bg-transparent outline-none" />
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
              <button className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <Filter className="h-3 w-3" /> {t("common.more")}
              </button>
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-border">
            {list.length === 0 && (
              <li className="p-8 text-center text-xs text-muted-foreground">
                <div className="font-medium text-sm text-foreground mb-1">{t("common.no_results")}</div>
                {t("common.empty_sub")}
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
          <TicketDetail ticket={selected} translated={translated} onTranslate={() => setTranslated((v) => !v)} />
        </section>

        <aside className="border-l border-border bg-surface overflow-y-auto min-h-0">
          <CopilotPanel ticket={selected} draftEdit={draftEdit} setDraftEdit={setDraftEdit} />
        </aside>
      </div>
    </AppShell>
  );
}

function TicketDetail({ ticket, translated, onTranslate }: { ticket: TicketDto; translated: boolean; onTranslate: () => void }) {
  const { t, lang } = useLang();
  const showLang = translated ? (lang === "DE" ? "EN" : "DE") : lang;
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
          <AIBadge confidence={ticket.confidence} />
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
        <p className="mt-2 text-sm leading-relaxed">{ticket.summary[showLang]}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard label={t("common.tenant")} value={ticket.tenant.name} sub={ticket.tenant.phone} />
        <InfoCard label={`${t("common.property")} / ${t("intake.unit")}`} value={ticket.tenant.apartment[lang]} sub={ticket.tenant.building} />
        <InfoCard label={t("common.category")} value={ticket.category[lang]} sub={`${t("common.language")} ${ticket.language}`} />
        <InfoCard label={t("inbox.recommended")} value={ticket.contractorName ?? "—"} sub={t("inbox.recommended_basis")} />
      </div>

      <section>
        <h3 className="text-sm font-semibold mb-2">{t("common.timeline")}</h3>
        <ol className="rounded-xl border border-border bg-surface divide-y divide-border">
          {ticket.history.map((h, i) => (
            <li key={i} className="flex gap-3 p-3 text-sm">
              <span className="w-12 shrink-0 text-[11px] text-muted-foreground">{h.at[lang]}</span>
              <span className={cn(
                "rounded-md px-2 py-0.5 text-[11px] h-fit",
                h.type === "ai" && "bg-ai/10 text-ai",
                h.type === "tenant" && "bg-info/10 text-info-foreground",
                h.type === "manager" && "bg-primary/10 text-primary",
                h.type === "contractor" && "bg-success/15 text-success-foreground",
              )}>{h.type === "ai" ? t("common.ai") : h.type === "tenant" ? t("common.tenant") : h.type === "manager" ? t("common.manager") : t("common.contractor")}</span>
              <p className="flex-1 leading-snug">{h.text[lang]}</p>
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
  const [sent, setSent] = useState(false);
  const firstName = ticket.tenant.name.split(" ")[0];
  const draft = lang === "EN"
    ? `Hi ${firstName},\n\nthanks for your report. We've dispatched an emergency technician — ETA today between 11:00 and 13:00. You'll get an update once they're on the way.\n\nBest\nYour property management`
    : `Hallo ${firstName},\n\nvielen Dank für Ihre Meldung. Wir haben einen Heizungsnotdienst beauftragt – ETA heute zwischen 11:00 und 13:00 Uhr. Sie erhalten ein Update, sobald der Techniker unterwegs ist.\n\nBeste Grüße\nIhre Hausverwaltung`;
  const [draftText, setDraftText] = useState(draft);

  useEffect(() => {
    setDraftText(draft);
    setSent(false);
  }, [draft, ticket.id]);

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
          <AIBadge confidence={94} />
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
