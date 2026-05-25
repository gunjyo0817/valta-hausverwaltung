import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Paperclip, Send, Languages, CheckCircle2, Image as ImageIcon, Building2, ArrowRight } from "lucide-react";
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
        { ai: "Is the situation urgent for you?", chips: ["Very urgent", "Can wait"] },
      ]
    : [
        { ai: "Danke. Seit wann besteht das Problem?", chips: ["Heute", "Gestern Abend", "Seit mehreren Tagen"] },
        { ai: "Betrifft es die gesamte Wohnung oder nur einen Raum?", chips: ["Gesamte Wohnung", "Nur ein Raum"] },
        { ai: "Können Sie kurz beschreiben, wie kalt es ist? Haben Sie schon den Thermostat geprüft?", chips: ["Sehr kalt", "Erträglich"] },
        { ai: "Möchten Sie ein Foto vom Thermostat oder Heizkörper anhängen? (optional)", chips: ["Foto hinzufügen", "Überspringen"] },
        { ai: "Ist die Situation für Sie dringend?", chips: ["Sehr dringend", "Kann warten"] },
      ];

  const [messages, setMessages] = useState<Msg[]>([{ from: "ai", text: t("intake.greeting") }]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [structuring, setStructuring] = useState(false);
  const [apartment, setApartment] = useState("Lindenstraße 22 · WE 14, 3. OG");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing, structuring]);

  const photoLabel = lang === "EN" ? "Add photo" : "Foto hinzufügen";

  const respond = (text: string, photo?: boolean) => {
    if (!text && !photo) return;
    const newUser: Msg = { from: "user", text: photo ? t("intake.photo_attached") : text, photo };
    const next = flow[step];
    setMessages((m) => [...m, newUser]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      if (next) {
        setMessages((m) => [...m, { from: "ai", text: next.ai, chips: next.chips }]);
        setStep((s) => s + 1);
      } else {
        setMessages((m) => [...m, { from: "ai", text: t("intake.thanks_structuring") }]);
        setStructuring(true);
        window.setTimeout(() => { setStructuring(false); setDone(true); }, 1800);
      }
    }, 700);
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
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.from === "user" && "justify-end")}>
                  {m.from === "ai" && (
                    <div className="h-8 w-8 shrink-0 rounded-lg ai-gradient flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-ai" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-md rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-soft",
                    m.from === "ai" ? "bg-surface border border-border rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm",
                  )}>
                    {m.text}
                    {m.chips && (
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
              {done && <TicketPreview />}
              <div ref={endRef} />
            </div>
          </div>

          {!done && (
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
                <button onClick={() => respond(input)} className="h-9 inline-flex items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
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
              <div className="text-sm">{apartment}</div>
            </div>
            <button onClick={() => setApartment(lang === "EN" ? "Other address…" : "Andere Adresse…")} className="mt-2 text-xs text-primary hover:underline">{t("intake.change_unit")}</button>
          </div>

          <div className="rounded-xl border border-border ai-gradient p-3">
            <div className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-ai" /> {t("intake.what_happens")}</div>
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

function TicketPreview() {
  const { t, lang } = useLang();
  return (
    <div className="mt-2 rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
      <div className="ai-gradient p-3 flex items-center gap-2 text-xs font-semibold">
        <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("intake.structured_ticket")}
        <span className="ml-auto text-[10px] uppercase tracking-wider bg-success/15 text-success-foreground rounded px-1.5 py-0.5 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> {t("intake.submitted")}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="text-sm font-semibold">{lang === "EN" ? "Heating completely down" : "Heizung komplett ausgefallen"}</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label={t("common.category")} value={lang === "EN" ? "Heating" : "Heizung"} />
          <Field label={t("common.priority")} value={t("urgency.critical")} />
          <Field label={t("common.since")} value={lang === "EN" ? "Yesterday evening" : "Gestern Abend"} />
          <Field label={lang === "EN" ? "Affected" : "Betroffen"} value={lang === "EN" ? "Whole apartment" : "Gesamte Wohnung"} />
        </div>
        <div className="rounded-lg bg-background border border-border p-3 text-xs leading-relaxed">
          <span className="font-semibold">{t("common.summary")}: </span>
          {lang === "EN"
            ? "Heating down since yesterday evening, entire apartment cold. Tenant considers it urgent. AI recommends immediate dispatch of an emergency heating service."
            : "Heizung ausgefallen seit gestern Abend, gesamte Wohnung kalt. Mieter:in schätzt Lage als dringend ein. AI empfiehlt sofortige Beauftragung Heizungsnotdienst."}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" /> {lang === "EN" ? "1 photo attached" : "1 Foto angehängt"}
        </div>
        <Link to="/portal" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          {t("intake.track")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 shrink-0 rounded-lg ai-gradient flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-ai" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-3.5 py-3 shadow-soft">
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
    ? ["Category detected: Heating", "Urgency assessed: Critical", "Summary generated", "Contractor recommendation prepared"]
    : ["Kategorie erkannt: Heizung", "Dringlichkeit eingeschätzt: Kritisch", "Zusammenfassung generiert", "Handwerker-Empfehlung vorbereitet"];
  return (
    <div className="mt-2 rounded-2xl border border-border ai-gradient p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Sparkles className="h-3.5 w-3.5 text-ai animate-pulse" /> {t("intake.structuring")}
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
