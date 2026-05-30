import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { CheckCircle2, Circle, Sparkles, Wrench, MessageSquareText, Image as ImageIcon, Phone, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "My request · Valta" },
      { name: "description", content: "Track your maintenance request in real time." },
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
  const { t, lang } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestNotificationPermission = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    void Notification.requestPermission();
  };

  const steps = lang === "EN" ? [
    { label: "Received", at: "Today, 08:42", done: true, ai: true, desc: "Your report was captured and structured by Valta." },
    { label: "Reviewed by property management", at: "Today, 08:45", done: true, desc: "We confirmed the details and determined the appropriate response." },
    { label: "Contractor dispatched", at: "Today, 09:10", done: true, desc: "Müller Heizung GmbH — ETA 11:00–13:00." },
    { label: "Technician on the way", at: "ETA 11:00", done: false, current: true, desc: "You'll be notified the moment the technician arrives." },
    { label: "Repair completed", at: "planned today", done: false, desc: "Please confirm once the issue is resolved." },
  ] : [
    { label: "Eingegangen", at: "Heute, 08:42", done: true, ai: true, desc: "Ihre Meldung wurde von Valta erfasst und strukturiert." },
    { label: "Von Hausverwaltung geprüft", at: "Heute, 08:45", done: true, desc: "Wir haben die Angaben bestätigt und die passende Reaktion festgelegt." },
    { label: "Handwerker beauftragt", at: "Heute, 09:10", done: true, desc: "Müller Heizung GmbH – ETA 11:00–13:00." },
    { label: "Techniker unterwegs", at: "ETA 11:00", done: false, current: true, desc: "Sie erhalten eine Benachrichtigung, sobald der Techniker eintrifft." },
    { label: "Reparatur abgeschlossen", at: "geplant heute", done: false, desc: "Bitte bestätigen Sie nach Abschluss die Behebung." },
  ];

  const updates = lang === "EN" ? [
    { at: "09:14", from: "Property management", text: "Müller Heizung GmbH has been dispatched. ETA 11:00–13:00." },
    { at: "08:45", from: "Valta", text: "We are reviewing your report and determining the appropriate response." },
    { at: "08:42", from: "You", text: "Heating down since yesterday evening, the whole apartment is cold." },
  ] : [
    { at: "09:14", from: "Hausverwaltung", text: "Müller Heizung GmbH wurde beauftragt. Voraussichtliche Ankunft 11:00–13:00." },
    { at: "08:45", from: "Valta", text: "Wir prüfen Ihre Meldung und legen die passende Reaktion fest." },
    { at: "08:42", from: "Sie", text: "Heizung ausgefallen seit gestern Abend, gesamte Wohnung kalt." },
  ];

  const statusLabel = lang === "EN" ? "We're on it" : "Wir kümmern uns";

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border glass flex items-center px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">V</div>
          <div className="text-sm font-semibold">{t("portal.title")}</div>
        </Link>
        <div className="ml-auto text-xs text-muted-foreground">Lindenstraße 22 · WE 14</div>
      </header>

      <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">{t("portal.case")} VLT-2041</div>
              <h1 className="text-lg font-semibold tracking-tight">{lang === "EN" ? "Heating completely down" : "Heizung komplett ausgefallen"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("portal.subtitle")}</p>
            </div>
            <span className="text-[11px] rounded-full bg-success/15 text-success px-2 py-1 font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" /> {statusLabel}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label={t("portal.assigned_contractor")} value="Müller Heizung GmbH" />
            <Stat label={t("common.eta")} value="11:00 – 13:00" />
            <Stat label={lang === "EN" ? "Status" : "Status"} value={lang === "EN" ? "Technician on the way" : "Techniker unterwegs"} />
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
              {updates.map((u, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-muted-foreground">{u.at}</span>
                    <span className="text-xs font-medium">{u.from}</span>
                  </div>
                  <p className="leading-snug text-foreground/80">{u.text}</p>
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
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              ))}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:bg-accent">
                {t("portal.add_photo")}
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <a href="tel:+493012345678" className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                <Phone className="h-3.5 w-3.5" /> {t("portal.contact_pm")}
              </a>
              <button onClick={requestNotificationPermission} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                <Bell className="h-3.5 w-3.5" /> {t("portal.notifications")}
              </button>
            </div>
          </div>
        </section>

        <div className="text-center text-xs text-muted-foreground">
          <Link to="/intake" className="text-primary hover:underline">{t("intake.further")}</Link> · powered by Valta
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "destructive" }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm font-medium", tone === "destructive" && "text-destructive")}>{value}</div>
    </div>
  );
}
