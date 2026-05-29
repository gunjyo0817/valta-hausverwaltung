import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { UrgencyBadge } from "@/components/Badges";
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, User, Phone } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contractor/schedule")({ component: Schedule });

const days = [
  { de: "Mo", en: "Mon", date: "25.05" },
  { de: "Di", en: "Tue", date: "26.05" },
  { de: "Mi", en: "Wed", date: "27.05" },
  { de: "Do", en: "Thu", date: "28.05" },
  { de: "Fr", en: "Fri", date: "29.05" },
];

type Appt = {
  ticketIndex: number;
  day: number;
  start: string;
  end: string;
  tenant: string;
};

const appts: Appt[] = [
  { ticketIndex: 0, day: 0, start: "09:00", end: "11:00", tenant: "Anna Becker" },
  { ticketIndex: 1, day: 0, start: "14:00", end: "15:30", tenant: "Mehmet Yilmaz" },
  { ticketIndex: 2, day: 1, start: "08:30", end: "10:00", tenant: "Sophia Klein" },
  { ticketIndex: 3, day: 2, start: "11:00", end: "12:30", tenant: "Lukas Wagner" },
  { ticketIndex: 4, day: 3, start: "09:00", end: "10:30", tenant: "Clara Hoffmann" },
  { ticketIndex: 0, day: 3, start: "14:00", end: "16:00", tenant: "Anna Becker" },
  { ticketIndex: 6, day: 4, start: "10:00", end: "11:00", tenant: "Elena Fischer" },
];

function Schedule() {
  const { t, lang } = useLang();
  const [view, setView] = useState<"today" | "week">("week");

  const today = appts.filter((a) => a.day === 0);
  const list = view === "today" ? today : appts;

  return (
    <AppShell title={t("cdash.schedule_title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-md border border-border bg-surface overflow-hidden text-xs">
            <button onClick={() => setView("today")} className={`px-3 py-1.5 font-semibold ${view === "today" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{t("cdash.today")}</button>
            <button onClick={() => setView("week")} className={`px-3 py-1.5 font-semibold ${view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{t("cdash.this_week")}</button>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent border border-border"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <span className="font-semibold text-foreground px-2">KW 22 · 25.–29. Mai 2026</span>
            <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent border border-border"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === "EN" ? "Today" : "Heute", value: today.length, hint: lang === "EN" ? "appointments" : "Termine" },
            { label: lang === "EN" ? "This week" : "Diese Woche", value: appts.length, hint: lang === "EN" ? "scheduled" : "geplant" },
            { label: lang === "EN" ? "Properties" : "Objekte", value: 5, hint: lang === "EN" ? "covered" : "betreut" },
            { label: lang === "EN" ? "Avg. duration" : "Ø Dauer", value: "1h 25", hint: lang === "EN" ? "per job" : "pro Auftrag" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="text-[11px] text-muted-foreground">{k.hint}</div>
            </div>
          ))}
        </div>

        {view === "week" ? (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="grid grid-cols-5 border-b border-border bg-surface-muted">
              {days.map((d) => (
                <div key={d.date} className="px-3 py-3 text-center border-r border-border last:border-r-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{lang === "DE" ? d.de : d.en}</div>
                  <div className="text-sm font-semibold">{d.date}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 min-h-[420px]">
              {days.map((d, i) => {
                const dayAppts = appts.filter((a) => a.day === i);
                return (
                  <div key={d.date} className="border-r border-border last:border-r-0 p-2 space-y-2">
                    {dayAppts.length === 0 && (
                      <div className="text-[11px] text-muted-foreground/60 text-center py-6">—</div>
                    )}
                    {dayAppts.map((a, j) => {
                      const tk = tickets[a.ticketIndex];
                      if (!tk) return null;
                      return (
                        <Link key={j} to="/ticket/$id" params={{ id: tk.id }} className="block rounded-lg border border-border bg-surface hover:border-primary/40 hover:shadow-soft transition-all p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">{tk.id}</span>
                            <UrgencyBadge urgency={tk.urgency} />
                          </div>
                          <div className="mt-1 text-xs font-semibold line-clamp-2">{tk.title[lang]}</div>
                          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {a.start} – {a.end}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {tk.tenant.building.split(",")[0]}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate"><User className="h-2.5 w-2.5" /> {a.tenant}</div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">{lang === "EN" ? "Today's appointments" : "Termine heute"}</div>
              <span className="ml-auto text-xs text-muted-foreground">{today.length} {lang === "EN" ? "appointments" : "Termine"}</span>
            </div>
            <div className="divide-y divide-border">
              {list.map((a, j) => {
                const tk = tickets[a.ticketIndex];
                if (!tk) return null;
                return (
                  <Link key={j} to="/ticket/$id" params={{ id: tk.id }} className="grid grid-cols-12 px-4 py-3 hover:bg-accent/30 items-center gap-3">
                    <div className="col-span-2 text-sm font-semibold tabular-nums">{a.start}<span className="text-muted-foreground"> – {a.end}</span></div>
                    <div className="col-span-5 min-w-0">
                      <div className="text-sm font-semibold truncate">{tk.title[lang]}</div>
                      <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{tk.tenant.building}</div>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <div className="text-xs flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" />{a.tenant}</div>
                      <div className="text-xs flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{tk.tenant.phone}</div>
                    </div>
                    <div className="col-span-2 flex justify-end"><UrgencyBadge urgency={tk.urgency} /></div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
