import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Paperclip, Send, Languages, CheckCircle2, Image as ImageIcon, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Schaden melden · Valta" },
      { name: "description", content: "AI-geführte Erfassung von Reparaturmeldungen für Mieter:innen." },
    ],
  }),
  component: IntakePage,
});

type Msg = { from: "ai" | "user"; text: string; chips?: string[]; photo?: boolean };

const script: Msg[] = [
  { from: "ai", text: "Hallo 👋 Ich bin Valta, der digitale Assistent Ihrer Hausverwaltung. Was möchten Sie melden?" },
];

const flow: Array<{ ai: string; chips?: string[] }> = [
  { ai: "Danke. Seit wann besteht das Problem?", chips: ["Heute", "Gestern Abend", "Seit mehreren Tagen"] },
  { ai: "Betrifft es die gesamte Wohnung oder nur einen Raum?", chips: ["Gesamte Wohnung", "Nur ein Raum"] },
  { ai: "Können Sie kurz beschreiben, wie kalt es ist? Haben Sie schon den Thermostat geprüft?", chips: ["Sehr kalt", "Erträglich"] },
  { ai: "Möchten Sie ein Foto vom Thermostat oder Heizkörper anhängen? (optional)", chips: ["Foto hinzufügen", "Überspringen"] },
  { ai: "Ist die Situation für Sie dringend?", chips: ["Sehr dringend", "Kann warten"] },
];

function IntakePage() {
  const [messages, setMessages] = useState<Msg[]>(script);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [language, setLanguage] = useState<"DE" | "EN">("DE");
  const [apartment, setApartment] = useState("Lindenstraße 22 · WE 14, 3. OG");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const respond = (text: string, photo?: boolean) => {
    if (!text && !photo) return;
    const newUser: Msg = { from: "user", text: photo ? "📎 Foto angehängt" : text, photo };
    const next = flow[step];
    const newMsgs = [...messages, newUser];
    if (next) {
      newMsgs.push({ from: "ai", text: next.ai, chips: next.chips });
      setStep(step + 1);
    } else {
      newMsgs.push({ from: "ai", text: "Vielen Dank. Ich erstelle jetzt ein strukturiertes Ticket für die Hausverwaltung…" });
      setDone(true);
    }
    setMessages(newMsgs);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border glass flex items-center px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">V</div>
          <div className="text-sm font-semibold">Valta · Schaden melden</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === "DE" ? "EN" : "DE")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent"
          >
            <Languages className="h-3.5 w-3.5" /> {language}
          </button>
          <Link to="/portal" className="text-xs text-primary hover:underline">Status verfolgen →</Link>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] min-h-0">
        {/* Chat */}
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
                            onClick={() => respond(c, c === "Foto hinzufügen")}
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
                  placeholder="Beschreiben Sie das Problem…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none py-1.5"
                />
                <button onClick={() => respond(input)} className="h-9 inline-flex items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  <Send className="h-3.5 w-3.5" /> Senden
                </button>
              </div>
              <p className="mx-auto max-w-2xl mt-2 text-[11px] text-muted-foreground text-center">
                Ihre Angaben werden direkt an die Hausverwaltung übermittelt. Keine Daten verlassen das Verwaltungssystem.
              </p>
            </div>
          )}
        </div>

        {/* Side context */}
        <aside className="hidden lg:flex flex-col border-l border-border bg-surface p-5 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wohneinheit</div>
            <div className="mt-2 rounded-xl border border-border p-3 flex items-center gap-3">
              <Building2 className="h-4 w-4 text-primary" />
              <div className="text-sm">{apartment}</div>
            </div>
            <button onClick={() => setApartment("Andere Adresse…")} className="mt-2 text-xs text-primary hover:underline">Wohnung wechseln</button>
          </div>

          <div className="rounded-xl border border-border ai-gradient p-3">
            <div className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-ai" /> Was passiert mit Ihrer Meldung?</div>
            <ol className="mt-2 space-y-1.5 text-xs text-foreground/80">
              <li>1. Valta stellt fehlende Rückfragen.</li>
              <li>2. Ein strukturiertes Ticket wird erstellt.</li>
              <li>3. Hausverwaltung beauftragt Handwerker.</li>
              <li>4. Sie erhalten Status-Updates.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-semibold">Tipps für schnelle Bearbeitung</div>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>• Fotos beschleunigen die Diagnose.</li>
              <li>• Geben Sie an, ob es akut ist.</li>
              <li>• Nennen Sie den genauen Ort.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TicketPreview() {
  return (
    <div className="mt-2 rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
      <div className="ai-gradient p-3 flex items-center gap-2 text-xs font-semibold">
        <Sparkles className="h-3.5 w-3.5 text-ai" /> AI-strukturiertes Reparatur-Ticket
        <span className="ml-auto text-[10px] uppercase tracking-wider bg-success/15 text-success-foreground rounded px-1.5 py-0.5 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Eingereicht
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="text-sm font-semibold">Heizung komplett ausgefallen</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Kategorie" value="Heizung" />
          <Field label="Priorität" value="Kritisch" />
          <Field label="Seit" value="Gestern Abend" />
          <Field label="Betroffen" value="Gesamte Wohnung" />
        </div>
        <div className="rounded-lg bg-background border border-border p-3 text-xs leading-relaxed">
          <span className="font-semibold">Zusammenfassung: </span>
          Heizung ausgefallen seit gestern Abend, gesamte Wohnung kalt. Mieter:in schätzt Lage als dringend ein. AI empfiehlt sofortige Beauftragung Heizungsnotdienst.
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" /> 1 Foto angehängt
        </div>
        <Link to="/portal" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          Status verfolgen <ArrowRight className="h-3 w-3" />
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
