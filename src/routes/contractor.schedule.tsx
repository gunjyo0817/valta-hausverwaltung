import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { UrgencyBadge } from "@/components/Badges";
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, User, Phone } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contractor/schedule")({ component: Schedule });

type Appt = {
  ticketIndex: number;
  day: number;
  start: string;
  end: string;
  tenant: string;
};

type WeekDay = { de: string; en: string; date: string };

type Week = {
  number: number;
  label: { de: string; en: string };
  days: WeekDay[];
  appts: Appt[];
};

const weeks: Week[] = [
  {
    number: 22,
    label: { de: "25.–29. Mai", en: "May 25–29" },
    days: [
      { de: "Mo", en: "Mon", date: "25.05" },
      { de: "Di", en: "Tue", date: "26.05" },
      { de: "Mi", en: "Wed", date: "27.05" },
      { de: "Do", en: "Thu", date: "28.05" },
      { de: "Fr", en: "Fri", date: "29.05" },
    ],
    appts: [
      { ticketIndex: 0, day: 0, start: "09:00", end: "11:00", tenant: "Anna Becker" },
      { ticketIndex: 1, day: 0, start: "14:00", end: "15:30", tenant: "Mehmet Yilmaz" },
      { ticketIndex: 2, day: 1, start: "08:30", end: "10:00", tenant: "Sophia Klein" },
      { ticketIndex: 3, day: 2, start: "11:00", end: "12:30", tenant: "Lukas Wagner" },
      { ticketIndex: 4, day: 3, start: "09:00", end: "10:30", tenant: "Clara Hoffmann" },
      { ticketIndex: 0, day: 3, start: "14:00", end: "16:00", tenant: "Anna Becker" },
      { ticketIndex: 6, day: 4, start: "10:00", end: "11:00", tenant: "Elena Fischer" },
    ],
  },
  {
    number: 23,
    label: { de: "1.–5. Juni", en: "Jun 1–5" },
    days: [
      { de: "Mo", en: "Mon", date: "01.06" },
      { de: "Di", en: "Tue", date: "02.06" },
      { de: "Mi", en: "Wed", date: "03.06" },
      { de: "Do", en: "Thu", date: "04.06" },
      { de: "Fr", en: "Fri", date: "05.06" },
    ],
    appts: [
      { ticketIndex: 2, day: 0, start: "08:00", end: "09:30", tenant: "Sophia Klein" },
      { ticketIndex: 4, day: 1, start: "10:00", end: "12:00", tenant: "Clara Hoffmann" },
      { ticketIndex: 1, day: 1, start: "13:30", end: "15:00", tenant: "Mehmet Yilmaz" },
      { ticketIndex: 6, day: 2, start: "09:30", end: "11:00", tenant: "Elena Fischer" },
      { ticketIndex: 3, day: 3, start: "14:00", end: "15:30", tenant: "Lukas Wagner" },
      { ticketIndex: 0, day: 4, start: "08:30", end: "10:30", tenant: "Anna Becker" },
    ],
  },
  {
    number: 24,
    label: { de: "8.–12. Juni", en: "Jun 8–12" },
    days: [
      { de: "Mo", en: "Mon", date: "08.06" },
      { de: "Di", en: "Tue", date: "09.06" },
      { de: "Mi", en: "Wed", date: "10.06" },
      { de: "Do", en: "Thu", date: "11.06" },
      { de: "Fr", en: "Fri", date: "12.06" },
    ],
    appts: [
      { ticketIndex: 1, day: 0, start: "09:00", end: "10:30", tenant: "Mehmet Yilmaz" },
      { ticketIndex: 0, day: 1, start: "11:00", end: "12:30", tenant: "Anna Becker" },
      { ticketIndex: 4, day: 2, start: "08:30", end: "10:00", tenant: "Clara Hoffmann" },
      { ticketIndex: 2, day: 2, start: "13:00", end: "14:30", tenant: "Sophia Klein" },
      { ticketIndex: 6, day: 4, start: "15:00", end: "16:30", tenant: "Elena Fischer" },
    ],
  },
];

const CURRENT_WEEK_INDEX = 0;

function Schedule() {
  const { t, lang } = useLang();
  const [view, setView] = useState<"today" | "week">("week");
  const [weekIdx, setWeekIdx] = useState(CURRENT_WEEK_INDEX);
  const [mobileDay, setMobileDay] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const week = weeks[weekIdx];
  const days = week.days;
  const appts = week.appts;

  const today = appts.filter((a) => a.day === 0);
  const list = view === "today" ? today : appts;
  const mobileDayAppts = appts.filter((a) => a.day === mobileDay);

  const changeWeek = (next: number) => {
    const clamped = Math.max(0, Math.min(weeks.length - 1, next));
    if (clamped === weekIdx) return;
    setWeekIdx(clamped);
    setAnimKey((k) => k + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const isCurrentWeek = weekIdx === CURRENT_WEEK_INDEX;

  return (
    <AppShell title={t("cdash.schedule_title")} subtitle={t("cdash.sub")}>
      <div className="p-4 md:p-8 space-y-5 md:space-y-6">
        {/* Toolbar (desktop only) */}
        <div className="hidden md:flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-md border border-border bg-surface overflow-hidden text-xs">
            <button onClick={() => setView("today")} className={`px-3 py-1.5 font-semibold ${view === "today" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{t("cdash.today")}</button>
            <button onClick={() => setView("week")} className={`px-3 py-1.5 font-semibold ${view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{t("cdash.this_week")}</button>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <button onClick={() => changeWeek(weekIdx - 1)} disabled={weekIdx === 0} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent border border-border disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <span className="font-semibold text-foreground px-2">KW {week.number} · {week.label[lang === "EN" ? "en" : "de"]} 2026</span>
            <button onClick={() => changeWeek(weekIdx + 1)} disabled={weekIdx === weeks.length - 1} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent border border-border disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
            {!isCurrentWeek && <button onClick={() => changeWeek(CURRENT_WEEK_INDEX)} className="ml-1 px-2 py-1 rounded-md border border-border hover:bg-accent text-foreground font-semibold">{lang === "EN" ? "Today" : "Heute"}</button>}
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
            <div key={k.label} className="rounded-xl border border-border bg-surface p-3 md:p-4">
              <div className="text-[11px] md:text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-1 md:mt-2 text-xl md:text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="text-[10px] md:text-[11px] text-muted-foreground">{k.hint}</div>
            </div>
          ))}
        </div>

        {/* MOBILE: day selector + agenda */}
        <div className="md:hidden space-y-4">
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {days.map((d, i) => {
              const count = appts.filter((a) => a.day === i).length;
              const active = mobileDay === i;
              return (
                <button
                  key={d.date}
                  onClick={() => setMobileDay(i)}
                  className={`shrink-0 min-w-[64px] rounded-lg border px-3 py-2 text-center transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/40"}`}
                >
                  <div className={`text-[10px] uppercase tracking-wider ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{lang === "DE" ? d.de : d.en}</div>
                  <div className="text-sm font-semibold tabular-nums">{d.date}</div>
                  <div className={`text-[10px] mt-0.5 ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{count} {lang === "EN" ? "jobs" : "Jobs"}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold">{lang === "DE" ? days[mobileDay].de : days[mobileDay].en}, {days[mobileDay].date}</span>
            <span className="ml-auto text-xs text-muted-foreground">{mobileDayAppts.length} {lang === "EN" ? "appointments" : "Termine"}</span>
          </div>

          {mobileDayAppts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              {lang === "EN" ? "No appointments scheduled." : "Keine Termine geplant."}
            </div>
          )}

          <div className="space-y-3">
            {mobileDayAppts.map((a, j) => {
              const tk = tickets[a.ticketIndex];
              if (!tk) return null;
              return (
                <div key={j} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold tabular-nums">{a.start} – {a.end}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">· {tk.id}</span>
                      </div>
                      <div className="mt-1.5 text-sm font-semibold">{tk.title[lang]}</div>
                    </div>
                    <UrgencyBadge urgency={tk.urgency} />
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{tk.tenant.building}</span></div>
                    <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 shrink-0" /><span className="text-foreground">{a.tenant}</span></div>
                    <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{tk.tenant.phone}</span></div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link to="/ticket/$id" params={{ id: tk.id }} className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">
                      {lang === "EN" ? "Open job" : "Auftrag öffnen"}
                    </Link>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(tk.tenant.building)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {lang === "EN" ? "Directions" : "Route"}
                    </a>
                    <button className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition">
                      {lang === "EN" ? "Mark in progress" : "Starten"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DESKTOP: week grid / today list */}
        <div className="hidden md:block">
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
      </div>
    </AppShell>
  );
}

