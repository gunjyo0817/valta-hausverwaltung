import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Paperclip, Send, Languages, CheckCircle2, Image as ImageIcon, Building2, ArrowRight, Pencil, ArrowLeft, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Report an issue · Valta" },
      { name: "description", content: "AI-guided intake for tenant maintenance requests." },
    ],
  }),
  component: IntakePage,
});

type Msg = { from: "ai" | "user"; text: string; chips?: string[]; photo?: boolean };

function IntakePage() {
  const { t, lang, setLang } = useLang();

  const flow: Array<{ ai: string; chips?: string[] }> = lang === "EN"
    ? [
        { ai: "Thanks. Since when has this been happening?", chips: ["Today", "Yesterday evening", "Several days"] },
        { ai: "Does it affect the whole apartment or only one room?", chips: ["Whole apartment", "One room"] },
        { ai: "Can you briefly describe how cold it is? Have you checked the thermostat?", chips: ["Very cold", "Bearable"] },
        { ai: "Would you like to attach a photo of the thermostat or radiator? (optional)", chips: ["Add photo", "Skip"] },
        { ai: "When may a technician access your home?", chips: ["Any time", "Weekday mornings", "After 5 pm"] },
      ]
    : [
        { ai: "Danke. Seit wann besteht das Problem?", chips: ["Heute", "Gestern Abend", "Seit mehreren Tagen"] },
        { ai: "Betrifft es die gesamte Wohnung oder nur einen Raum?", chips: ["Gesamte Wohnung", "Nur ein Raum"] },
        { ai: "Können Sie kurz beschreiben, wie kalt es ist? Haben Sie schon den Thermostat geprüft?", chips: ["Sehr kalt", "Erträglich"] },
        { ai: "Möchten Sie ein Foto vom Thermostat oder Heizkörper anhängen? (optional)", chips: ["Foto hinzufügen", "Überspringen"] },
        { ai: "Wann darf ein Techniker bei Ihnen kommen?", chips: ["Jederzeit", "Werktags vormittags", "Nach 17 Uhr"] },
      ];

  const [messages, setMessages] = useState<Msg[]>([{ from: "ai", text: t("intake.greeting") }]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [structuring, setStructuring] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Editable ticket draft (visible in review step)
  const [draft, setDraft] = useState({
    title: lang === "EN" ? "Heating completely down" : "Heizung komplett ausgefallen",
    category: lang === "EN" ? "Heating" : "Heizung",
    description: lang === "EN"
      ? "Heating down since yesterday evening, entire apartment cold. Thermostats unresponsive, radiators stay cold."
      : "Heizung ausgefallen seit gestern Abend, gesamte Wohnung kalt. Thermostate reagieren nicht, Heizkörper bleiben kalt.",
    apartment: "Lindenstraße 22 · WE 14, 3. OG",
    contactName: "Anna Becker",
    contactPhone: "+49 30 1234567",
    contactEmail: "a.becker@example.com",
    access: lang === "EN" ? "Weekday mornings, please call 30 min before" : "Werktags vormittags, bitte 30 Min vorher anrufen",
    photos: 1,
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing, structuring, reviewing]);

  const photoLabel = lang === "EN" ? "Add photo" : "Foto hinzufügen";

  const respond = (text: string, photo?: boolean) => {
    if (!text && !photo) return;
    const newUser: Msg = { from: "user", text: photo ? t("intake.photo_attached") : text, photo };
    const next = flow[step];
    setMessages((m) => [...m, newUser]);
    setInput("");
    if (photo) setDraft((d) => ({ ...d, photos: d.photos + 1 }));
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      if (next) {
        setMessages((m) => [...m, { from: "ai", text: next.ai, chips: next.chips }]);
        setStep((s) => s + 1);
      } else {
        setMessages((m) => [...m, { from: "ai", text: t("intake.thanks_structuring") }]);
        setStructuring(true);
        window.setTimeout(() => { setStructuring(false); setReviewing(true); }, 1600);
      }
    }, 600);
  };

  const restart = () => {
    setMessages([{ from: "ai", text: t("intake.greeting") }]);
    setStep(0);
    setReviewing(false);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border glass flex items-center px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">V</div>
          <div className="text-sm font-semibold">{t("intake.brand")}</div>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "DE" ? "EN" : "DE")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent"
          >
            <Languages className="h-3.5 w-3.5" /> {lang}
          </button>
          <Link to="/portal" className="text-xs text-primary hover:underline">{t("intake.track")}</Link>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
            <div className="mx-auto max-w-2xl space-y-4">
              {/* Stepper */}
              <Stepper step={submitted ? 4 : reviewing ? 3 : structuring ? 2 : 1} lang={lang} />

              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.from === "user" && "justify-end")}>
                  {m.from === "ai" && (
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-accent flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-md rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.from === "ai" ? "bg-surface border border-border rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm",
                  )}>
                    {m.text}
                    {m.chips && !reviewing && !submitted && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.chips.map((c) => (
                          <button
                            key={c}
                            onClick={() => respond(c, c === photoLabel)}
                            className="text-xs rounded-full border border-border bg-background px-2.5 py-1 hover:bg-accent text-foreground"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && <TypingBubble />}
              {structuring && <StructuringCard />}
              {reviewing && !submitted && (
                <TicketReview
                  draft={draft}
                  setDraft={setDraft}
                  onBack={() => { setReviewing(false); setMessages((m) => m.slice(0, -1)); setStep((s) => Math.max(0, s - 1)); }}
                  onSubmit={() => setSubmitted(true)}
                  lang={lang}
                />
              )}
              {submitted && <SubmittedCard onAnother={restart} />}
              <div ref={endRef} />
            </div>
          </div>

          {!reviewing && !submitted && (
            <div className="border-t border-border bg-surface p-3 md:p-4">
              <div className="mx-auto max-w-2xl flex items-end gap-2 rounded-xl border border-border bg-background p-2">
                <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); respond(input); }}}
                  placeholder={t("intake.placeholder")}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none py-1.5"
                />
                <button onClick={() => respond(input)} className="h-9 inline-flex items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                  <Send className="h-3.5 w-3.5" /> {t("intake.send")}
                </button>
              </div>
              <p className="mx-auto max-w-2xl mt-2 text-[11px] text-muted-foreground text-center">{t("intake.privacy")}</p>
            </div>
          )}
        </div>

        <aside className="hidden lg:flex flex-col border-l border-border bg-surface p-5 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("intake.unit")}</div>
            <div className="mt-2 rounded-xl border border-border p-3 flex items-center gap-3">
              <Building2 className="h-4 w-4 text-primary" />
              <div className="text-sm">{draft.apartment}</div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-accent/40 p-3">
            <div className="text-xs font-semibold">{t("intake.what_happens")}</div>
            <ol className="mt-2 space-y-1.5 text-xs text-foreground/80">
              <li>1. {t("intake.step1")}</li>
              <li>2. {t("intake.step2")}</li>
              <li>3. {t("intake.step3")}</li>
              <li>4. {t("intake.step4")}</li>
            </ol>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-semibold">{t("intake.tips")}</div>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>• {t("intake.tip1")}</li>
              <li>• {t("intake.tip2")}</li>
              <li>• {t("intake.tip3")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stepper({ step, lang }: { step: 1 | 2 | 3 | 4; lang: "DE" | "EN" }) {
  const labels = lang === "EN"
    ? ["Report issue", "AI structures", "Review & edit", "Submitted"]
    : ["Schaden melden", "AI strukturiert", "Prüfen & anpassen", "Eingereicht"];
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {labels.map((l, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <div key={l} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 border",
              done && "bg-success/10 border-success/30 text-success",
              active && "bg-primary text-primary-foreground border-primary",
              !active && !done && "bg-surface border-border text-muted-foreground",
            )}>
              <span className="font-semibold">{done ? "✓" : idx}</span>
              <span>{l}</span>
            </div>
            {i < labels.length - 1 && <span className="h-px w-3 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

type Draft = {
  title: string; category: string; description: string;
  apartment: string; contactName: string; contactPhone: string; contactEmail: string;
  access: string; photos: number;
};

function TicketReview({ draft, setDraft, onBack, onSubmit, lang }: { draft: Draft; setDraft: (u: (d: Draft) => Draft) => void; onBack: () => void; onSubmit: () => void; lang: "DE" | "EN" }) {
  const [editing, setEditing] = useState(false);
  const L = (de: string, en: string) => lang === "EN" ? en : de;
  return (
    <div className="mt-2 rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="bg-accent/40 px-4 py-2.5 flex items-center gap-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold">{L("Bitte prüfen Sie Ihre Angaben", "Please review your details")}</span>
        <span className="text-muted-foreground">· {L("Sie können alles vor dem Absenden bearbeiten.", "You can edit anything before sending.")}</span>
        <button
          onClick={() => setEditing((e) => !e)}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-semibold hover:bg-accent"
        >
          {editing ? <><CheckCircle2 className="h-3 w-3" /> {L("Fertig", "Done")}</> : <><Pencil className="h-3 w-3" /> {L("Bearbeiten", "Edit")}</>}
        </button>
      </div>

      <div className="p-4 space-y-4">
        <Editable
          label={L("Titel", "Title")}
          value={draft.title}
          editing={editing}
          onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
        />

        <Editable
          label={L("Beschreibung", "Issue description")}
          value={draft.description}
          editing={editing}
          textarea
          onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Editable
            label={L("Kategorie", "Category")}
            value={draft.category}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
          />
          <Editable
            label={L("Wohneinheit", "Apartment / unit")}
            value={draft.apartment}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, apartment: v }))}
          />
          <Editable
            label={L("Name", "Name")}
            value={draft.contactName}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, contactName: v }))}
          />
          <Editable
            label={L("Telefon", "Phone")}
            value={draft.contactPhone}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, contactPhone: v }))}
          />
          <Editable
            label={L("E-Mail", "Email")}
            value={draft.contactEmail}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, contactEmail: v }))}
          />
          <Editable
            label={L("Verfügbarkeit für Zugang", "Access availability")}
            value={draft.access}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, access: v }))}
          />
        </div>

        {/* Photos */}
        <div className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{L("Fotos", "Photos")}</div>
            <span className="text-[11px] text-muted-foreground">{draft.photos} {L("angehängt", "attached")}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: draft.photos }).map((_, i) => (
              <div key={i} className="relative h-14 w-14 rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                {editing && (
                  <button
                    onClick={() => setDraft((d) => ({ ...d, photos: Math.max(0, d.photos - 1) }))}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground inline-flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            {editing && (
              <button
                onClick={() => setDraft((d) => ({ ...d, photos: d.photos + 1 }))}
                className="h-14 w-14 rounded-md border-2 border-dashed border-border text-muted-foreground hover:bg-accent inline-flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tenant-friendly status note (no internal priority shown) */}
        <div className="rounded-md border border-border bg-accent/40 p-3 text-xs text-foreground/80">
          {L(
            "Ihre Hausverwaltung prüft die Meldung und legt die passende Reaktionszeit fest. Sie erhalten danach ein Update.",
            "Your property management will review the request and determine the appropriate response. You'll receive an update shortly.",
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-surface-muted">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {L("Zurück", "Back")}
        </button>
        <button
          onClick={onSubmit}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {L("Anfrage absenden", "Submit request")} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Editable({ label, value, editing, onChange, textarea }: { label: string; value: string; editing: boolean; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {editing ? (
        textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none bg-transparent text-sm outline-none border border-border rounded-md px-2 py-1.5 focus:border-primary"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm outline-none border border-border rounded-md px-2 py-1.5 focus:border-primary"
          />
        )
      ) : (
        <div className="mt-1 text-sm">{value}</div>
      )}
    </div>
  );
}

function SubmittedCard({ onAnother }: { onAnother: () => void }) {
  const { t, lang } = useLang();
  return (
    <div className="mt-2 rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="bg-success/10 border-b border-success/20 px-4 py-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <div className="text-sm font-semibold">{lang === "EN" ? "Your request has been received" : "Ihre Meldung ist eingegangen"}</div>
        <span className="ml-auto text-[10px] uppercase tracking-wider rounded-full bg-success/20 text-success px-2 py-0.5 font-semibold">{t("intake.submitted")}</span>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <p className="text-foreground/80">
          {lang === "EN"
            ? "We are reviewing your report and will determine the appropriate response. You'll receive an update shortly with the next steps."
            : "Wir prüfen Ihre Meldung und legen die passende Reaktion fest. Sie erhalten in Kürze ein Update mit den nächsten Schritten."}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to="/portal" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            {t("intake.track")}
          </Link>
          <button onClick={onAnother} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-accent">
            {t("intake.further")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-accent flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-3.5 py-3">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function StructuringCard() {
  const { t, lang } = useLang();
  const steps = lang === "EN"
    ? ["Category detected: Heating", "Summary generated", "Contact and unit confirmed", "Preparing your review"]
    : ["Kategorie erkannt: Heizung", "Zusammenfassung erstellt", "Kontakt und Wohnung bestätigt", "Bereite Prüfschritt vor"];
  return (
    <div className="mt-2 rounded-2xl border border-border bg-accent/40 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" /> {t("intake.structuring")}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1" style={{ animationDelay: `${i * 250}ms`, animationFillMode: "backwards" }}>
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
