import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { MessageSquareText, Send, Sparkles, Building2, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAddTicketEvent, useTickets } from "@/lib/api";

export const Route = createFileRoute("/contractor/messages")({ component: Messages });

type Sender = "pm" | "tenant" | "ai" | "me" | "system";

type Thread = {
  id: string;
  with: string;
  role: { DE: string; EN: string };
  ticket: string;
  unread: number;
  lastAt: string;
  preview: { DE: string; EN: string };
  type: Sender;
  messages: Array<{ from: Sender; at: string; text: { DE: string; EN: string } }>;
};

const quickReplies = {
  DE: ["Bin in 30 Minuten vor Ort.", "Termin bestätigt.", "Bitte Zugang sicherstellen.", "Ersatzteil wird bestellt."],
  EN: ["On site in 30 minutes.", "Appointment confirmed.", "Please ensure access.", "Spare part ordered."],
};

function Messages() {
  const { t, lang } = useLang();
  const ticketsQuery = useTickets();
  const { data } = ticketsQuery;
  const addEvent = useAddTicketEvent();
  const liveThreads = useMemo<Thread[]>(() => {
    return (data ?? []).map((ticket) => {
      const messages = ticket.history.map((event) => ({
        from: event.type === "manager" ? "pm" as const : event.type === "contractor" ? "me" as const : event.type === "tenant" ? "tenant" as const : event.type === "system" ? "system" as const : "ai" as const,
        at: event.at[lang],
        text: event.text,
      }));
      const last = messages[messages.length - 1];

      return {
        id: ticket.id,
        with: "Sarah Krüger",
        role: { DE: `${ticket.id} · ${ticket.category.DE}`, EN: `${ticket.id} · ${ticket.category.EN}` },
        ticket: ticket.id,
        unread: 0,
        lastAt: last?.at ?? ticket.createdAt[lang],
        preview: last?.text ?? ticket.summary,
        type: "pm",
        messages,
      };
    });
  }, [data, lang]);
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const active = liveThreads.find((th) => th.id === activeId) ?? liveThreads[0];

  useEffect(() => {
    if (!activeId && liveThreads.length > 0) {
      setActiveId(liveThreads[0].id);
      return;
    }
    if (!liveThreads.some((thread) => thread.id === activeId)) {
      setActiveId(liveThreads[0]?.id ?? "");
    }
  }, [activeId, liveThreads]);

  const sendReply = async () => {
    if (!active || !draft.trim() || addEvent.isPending) return;
    await addEvent.mutateAsync({
      data: {
        ticketId: active.ticket,
        type: "contractor",
        text: draft.trim(),
        actorName: "Müller Heizung GmbH",
        role: "contractor",
      },
    });
    setDraft("");
  };

  const senderLabel = (s: Sender) =>
    s === "system" ? (lang === "EN" ? "Delivery" : "Zustellung") : s === "ai" ? "Valta" : s === "pm" ? (lang === "EN" ? "Property management" : "Hausverwaltung") : s === "tenant" ? (lang === "EN" ? "Tenant" : "Mieter:in") : (lang === "EN" ? "You" : "Sie");

  return (
    <AppShell title={t("cdash.messages_title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8">
        {ticketsQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Messages could not be loaded" : "Nachrichten konnten nicht geladen werden"}
            description={lang === "EN" ? "The ticket message read failed. This is different from an empty demo database." : "Die Abfrage der Ticket-Nachrichten ist fehlgeschlagen. Das ist etwas anderes als eine leere Demo-Datenbank."}
            className="mb-4"
          />
        )}
        <div className="rounded-xl border border-border bg-surface overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[560px]">
          {/* Thread list */}
          <div className="border-r border-border divide-y divide-border overflow-y-auto">
            {liveThreads.length === 0 && !ticketsQuery.isLoading && (
              <div className="p-4">
                <EmptyDataState
                  title={lang === "EN" ? "No message threads" : "Keine Nachrichtenverlaeufe"}
                  description={lang === "EN" ? "There are no ticket records to build contractor conversations from. Reload mock data from the admin page to restore threads." : "Es gibt keine Ticket-Datensaetze fuer Handwerker-Konversationen. Lade Mock-Daten im Adminbereich neu, um Verlaeufe wiederherzustellen."}
                  className="p-5"
                />
              </div>
            )}
            {liveThreads.map((th) => (
              <button
                key={th.id}
                onClick={() => setActiveId(th.id)}
                className={cn("w-full text-left p-4 hover:bg-accent/40 transition-colors", activeId === th.id && "bg-accent/60")}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                    th.type === "pm" ? "bg-primary/10 text-primary" : th.type === "tenant" ? "bg-success/10 text-success" : "bg-accent text-muted-foreground")}>
                    {th.type === "tenant" ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold truncate">{th.with}</div>
                      <div className="text-[11px] text-muted-foreground shrink-0">{th.lastAt}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{th.role[lang]}</div>
                    <div className="text-xs text-foreground/80 line-clamp-1 mt-0.5">{th.preview[lang]}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">{th.ticket}</span>
                      {th.unread > 0 && <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-semibold">{th.unread}</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Conversation */}
          {active ? (
          <div className="flex flex-col min-w-0">
            <div className="border-b border-border px-5 py-3 flex items-center gap-3">
              <div>
                <div className="text-sm font-semibold">{active.with}</div>
                <div className="text-[11px] text-muted-foreground">{active.role[lang]} · {active.ticket}</div>
              </div>
              <div className="ml-auto text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <MessageSquareText className="h-3 w-3" /> {lang === "EN" ? "Unified thread" : "Vereinter Thread"}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface-muted">
              {active.messages.map((m, i) => {
                const mine = m.from === "me";
                return (
                  <div key={i} className={cn("flex gap-2", mine && "justify-end")}>
                    {!mine && (
                      <div className={cn("h-7 w-7 rounded-md shrink-0 flex items-center justify-center text-[10px] font-semibold",
                        m.from === "ai" ? "bg-accent text-primary" : m.from === "pm" ? "bg-primary/10 text-primary" : m.from === "system" ? "bg-warning/15 text-warning" : "bg-success/10 text-success")}>
                        {m.from === "ai" ? <Sparkles className="h-3.5 w-3.5" /> : m.from === "pm" ? "HV" : m.from === "system" ? "DEL" : "M"}
                      </div>
                    )}
                    <div className={cn(
                      "max-w-md rounded-xl px-3 py-2 text-sm",
                      mine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-surface border border-border rounded-tl-sm",
                      m.from === "system" && "border-warning/30 bg-warning/5",
                    )}>
                      <div className={cn("text-[10px] mb-0.5 font-semibold uppercase tracking-wider", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {senderLabel(m.from)} · {m.at}
                      </div>
                      <div className="leading-snug">{m.text[lang]}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick replies + composer */}
            <div className="border-t border-border p-3 space-y-2 bg-surface">
              <div className="flex flex-wrap gap-1.5">
                {quickReplies[lang].map((q) => (
                  <button key={q} onClick={() => setDraft(q)} className="text-[11px] rounded-full border border-border bg-surface px-2.5 py-1 hover:bg-accent">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  placeholder={lang === "EN" ? "Type a reply…" : "Antwort schreiben…"}
                  className="flex-1 resize-none bg-transparent text-sm outline-none py-1.5"
                />
                <button onClick={sendReply} disabled={!draft.trim() || addEvent.isPending} className="h-9 inline-flex items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <Send className="h-3.5 w-3.5" /> {lang === "EN" ? "Send" : "Senden"}
                </button>
              </div>
            </div>
          </div>
          ) : (
            <div className="p-5">
              <EmptyDataState
                title={lang === "EN" ? "No conversation selected" : "Keine Konversation ausgewaehlt"}
                description={lang === "EN" ? "Reload mock data from the admin page to restore contractor conversations." : "Lade Mock-Daten im Adminbereich neu, um Handwerker-Konversationen wiederherzustellen."}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
