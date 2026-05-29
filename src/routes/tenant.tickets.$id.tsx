import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { StatusBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Circle, Clock, Image as ImageIcon, MessageSquareText, Phone, Sparkles, Wrench, Bell } from "lucide-react";

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
  loader: ({ params }) => {
    const ticket = tickets.find((tk) => tk.id === params.id);
    if (!ticket) throw notFound();
    return { ticket };
  },
  component: TicketTrackingPage,
});

function TicketTrackingPage() {
  const { ticket } = Route.useLoaderData();
  const { t, lang } = useLang();

  // Derive steps from current ticket status
  const order: Record<string, number> = { new: 1, waiting: 2, contractor_assigned: 3, in_progress: 4, resolved: 5 };
  const reached = order[ticket.status] ?? 1;
  const steps = (lang === "EN"
    ? [
        { label: "Received", at: ticket.createdAt.EN, desc: "Your report was captured and structured by Valta.", ai: true },
        { label: "Reviewed by property management", at: "—", desc: "We confirmed the details and determined the appropriate response." },
        { label: "Contractor dispatched", at: "—", desc: ticket.contractorName ? `${ticket.contractorName} assigned.` : "Selecting the right contractor." },
        { label: "Technician on the way", at: "ETA 11:00", desc: "You'll be notified the moment the technician arrives." },
        { label: "Repair completed", at: "—", desc: "Please confirm once the issue is resolved." },
      ]
    : [
        { label: "Eingegangen", at: ticket.createdAt.DE, desc: "Ihre Meldung wurde von Valta erfasst und strukturiert.", ai: true },
        { label: "Von Hausverwaltung geprüft", at: "—", desc: "Wir haben die Angaben bestätigt und die passende Reaktion festgelegt." },
        { label: "Handwerker beauftragt", at: "—", desc: ticket.contractorName ? `${ticket.contractorName} beauftragt.` : "Passender Handwerker wird ausgewählt." },
        { label: "Techniker unterwegs", at: "ETA 11:00", desc: "Sie erhalten eine Benachrichtigung, sobald der Techniker eintrifft." },
        { label: "Reparatur abgeschlossen", at: "—", desc: "Bitte bestätigen Sie nach Abschluss die Behebung." },
      ]
  ).map((s, idx) => ({ ...s, done: idx + 1 < reached, current: idx + 1 === reached }));

  const statusLabel = ticket.status === "resolved"
    ? (lang === "EN" ? "Resolved" : "Erledigt")
    : (lang === "EN" ? "We're on it" : "Wir kümmern uns");

  return (
    <AppShell title={ticket.title[lang]} subtitle={`${ticket.id} · ${ticket.category[lang]}`}>
      <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
        <Link to="/tenant/tickets" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-3.5 w-3.5" /> {lang === "EN" ? "All requests" : "Alle Anfragen"}
        </Link>

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
            <Stat label={t("common.eta")} value="11:00 – 13:00" />
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

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">{t("portal.updates")}</h2>
            </div>
            <ul className="space-y-3">
              {ticket.history.map((u: typeof ticket.history[number], i: number) => (
                <li key={i} className="text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-muted-foreground">{u.at[lang]}</span>
                    <span className="text-xs font-medium capitalize">{u.type}</span>
                  </div>
                  <p className="leading-snug text-foreground/80">{u.text[lang]}</p>
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
              {Array.from({ length: Math.max(ticket.photos, 1) }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              ))}
              <button className="aspect-square rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:bg-accent">
                {t("portal.add_photo")}
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <a href={`tel:${ticket.tenant.phone}`} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                <Phone className="h-3.5 w-3.5" /> {t("portal.contact_pm")}
              </a>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
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
