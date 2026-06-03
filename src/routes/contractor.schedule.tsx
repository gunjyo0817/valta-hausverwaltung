import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Phone, User } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { UrgencyBadge } from "@/components/Badges";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useContractorSchedule, useRescheduleAppointment, useUpdateContractorJob, type ContractorAppointmentDto } from "@/lib/api";

export const Route = createFileRoute("/contractor/schedule")({ component: Schedule });

function localDateTimeValue(iso?: string | null) {
  const date = iso ? new Date(iso) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function startOfIsoWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  return result;
}

function weekNumber(date: Date) {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil((((value.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function weekDays(weekStart: Date, lang: "DE" | "EN") {
  return Array.from({ length: 5 }).map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      date,
      key: date.toISOString().slice(0, 10),
      day: new Intl.DateTimeFormat(lang === "EN" ? "en-US" : "de-DE", { weekday: "short" }).format(date),
      label: new Intl.DateTimeFormat(lang === "EN" ? "en-US" : "de-DE", { day: "2-digit", month: "2-digit" }).format(date),
    };
  });
}

function appointmentDateKey(appointment: ContractorAppointmentDto) {
  return appointment.scheduledFor ? new Date(appointment.scheduledFor).toISOString().slice(0, 10) : "unscheduled";
}

function Schedule() {
  const { t, lang } = useLang();
  const scheduleQuery = useContractorSchedule();
  const updateJob = useUpdateContractorJob();
  const reschedule = useRescheduleAppointment();
  const appointments = scheduleQuery.data ?? [];
  const [view, setView] = useState<"today" | "week">("week");
  const [mobileDay, setMobileDay] = useState(0);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const currentWeek = weekNumber(new Date());
  const availableWeeks = useMemo(() => {
    const values = Array.from(new Set(appointments.filter((appt) => appt.scheduledFor).map((appt) => appt.weekNumber))).sort((a, b) => a - b);
    return values.length > 0 ? values : [currentWeek];
  }, [appointments, currentWeek]);
  const [weekIdx, setWeekIdx] = useState(0);
  const selectedWeek = availableWeeks[Math.min(weekIdx, availableWeeks.length - 1)] ?? currentWeek;
  const weekStart = startOfIsoWeek(new Date(appointments.find((appt) => appt.weekNumber === selectedWeek)?.scheduledFor ?? new Date()));
  const days = weekDays(weekStart, lang);
  const todayKey = new Date().toISOString().slice(0, 10);

  const visibleAppts = appointments.filter((appt) => appt.weekNumber === selectedWeek);
  const today = appointments.filter((appt) => appointmentDateKey(appt) === todayKey);
  const list = view === "today" ? today : visibleAppts;
  const mobileDayAppts = visibleAppts.filter((appt) => appointmentDateKey(appt) === days[mobileDay]?.key);
  const propertiesCovered = new Set(visibleAppts.map((appt) => appt.ticket.tenant.building)).size;

  const changeWeek = (next: number) => {
    setWeekIdx(Math.max(0, Math.min(availableWeeks.length - 1, next)));
  };

  const startJob = async (ticketId: string) => {
    setActionError(null);
    try {
      await updateJob.mutateAsync({ data: { ticketId, action: "start", role: "contractor" } });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (lang === "EN" ? "The job could not be started." : "Der Auftrag konnte nicht gestartet werden."));
    }
  };

  const beginReschedule = (appointment: ContractorAppointmentDto) => {
    setActionError(null);
    setEditingTicketId(appointment.ticket.id);
    setNextDate(localDateTimeValue(appointment.scheduledFor));
  };

  const submitReschedule = async (ticketId: string) => {
    setActionError(null);
    try {
      await reschedule.mutateAsync({
        data: {
          ticketId,
          scheduledFor: new Date(nextDate).toISOString(),
          role: "contractor",
        },
      });
      setEditingTicketId(null);
      setNextDate("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (lang === "EN" ? "The appointment could not be rescheduled." : "Der Termin konnte nicht verschoben werden."));
    }
  };

  return (
    <AppShell title={t("cdash.schedule_title")} subtitle={t("cdash.sub")}>
      <div className="p-4 md:p-8 space-y-5 md:space-y-6">
        {scheduleQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Schedule data could not be loaded" : "Zeitplan konnte nicht geladen werden"}
            description={lang === "EN" ? "The contractor schedule read failed. This is different from an empty demo database." : "Die Abfrage des Handwerker-Zeitplans ist fehlgeschlagen. Das ist etwas anderes als eine leere Demo-Datenbank."}
          />
        )}
        {actionError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {lang === "EN" ? "Action failed: " : "Aktion fehlgeschlagen: "}
            <span className="font-medium">{actionError}</span>
          </div>
        )}
        {appointments.length === 0 && !scheduleQuery.isLoading && (
          <EmptyDataState
            title={lang === "EN" ? "No scheduled jobs" : "Keine geplanten Auftraege"}
            description={lang === "EN" ? "There are no active scheduled jobs for this demo contractor. Reload mock data from the admin page to restore appointments." : "Fuer diesen Demo-Handwerker gibt es keine aktiven geplanten Auftraege. Lade Mock-Daten im Adminbereich neu, um Termine wiederherzustellen."}
          />
        )}

        <div className="hidden md:flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-md border border-border bg-surface overflow-hidden text-xs">
            <button onClick={() => setView("today")} className={cn("px-3 py-1.5 font-semibold", view === "today" ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>{t("cdash.today")}</button>
            <button onClick={() => setView("week")} className={cn("px-3 py-1.5 font-semibold", view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>{t("cdash.this_week")}</button>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <button onClick={() => changeWeek(weekIdx - 1)} disabled={weekIdx === 0} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent border border-border disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <span className="font-semibold text-foreground px-2">KW {selectedWeek}</span>
            <button onClick={() => changeWeek(weekIdx + 1)} disabled={weekIdx >= availableWeeks.length - 1} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent border border-border disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === "EN" ? "Today" : "Heute", value: today.length, hint: lang === "EN" ? "appointments" : "Termine" },
            { label: lang === "EN" ? "This week" : "Diese Woche", value: visibleAppts.length, hint: lang === "EN" ? "scheduled" : "geplant" },
            { label: lang === "EN" ? "Properties" : "Objekte", value: propertiesCovered, hint: lang === "EN" ? "covered" : "betreut" },
            { label: lang === "EN" ? "Avg. duration" : "Durchschn. Dauer", value: "1h 30", hint: lang === "EN" ? "per job" : "pro Auftrag" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-3 md:p-4">
              <div className="text-[11px] md:text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-1 md:mt-2 text-xl md:text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="text-[10px] md:text-[11px] text-muted-foreground">{k.hint}</div>
            </div>
          ))}
        </div>

        <div className="md:hidden space-y-4">
          <div className="rounded-xl border border-border bg-surface p-2.5 flex items-center gap-2">
            <button onClick={() => changeWeek(weekIdx - 1)} disabled={weekIdx === 0} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex-1 text-center text-sm font-semibold">KW {selectedWeek}</div>
            <button onClick={() => changeWeek(weekIdx + 1)} disabled={weekIdx >= availableWeeks.length - 1} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {days.map((d, i) => {
              const count = visibleAppts.filter((appt) => appointmentDateKey(appt) === d.key).length;
              const active = mobileDay === i;
              return (
                <button key={d.key} onClick={() => setMobileDay(i)} className={cn("shrink-0 min-w-[64px] rounded-lg border px-3 py-2 text-center transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/40")}>
                  <div className={cn("text-[10px] uppercase tracking-wider", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{d.day}</div>
                  <div className="text-sm font-semibold tabular-nums">{d.label}</div>
                  <div className={cn("text-[10px] mt-0.5", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{count} {lang === "EN" ? "jobs" : "Jobs"}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold">{days[mobileDay]?.day}, {days[mobileDay]?.label}</span>
            <span className="ml-auto text-xs text-muted-foreground">{mobileDayAppts.length} {lang === "EN" ? "appointments" : "Termine"}</span>
          </div>

          {mobileDayAppts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              {lang === "EN" ? "No appointments scheduled." : "Keine Termine geplant."}
            </div>
          )}
          <div className="space-y-3">
            {mobileDayAppts.map((appt) => <AppointmentCard key={appt.assignmentId} appointment={appt} lang={lang} t={t} editingTicketId={editingTicketId} nextDate={nextDate} setNextDate={setNextDate} beginReschedule={beginReschedule} submitReschedule={submitReschedule} startJob={startJob} busy={updateJob.isPending || reschedule.isPending} />)}
          </div>
        </div>

        <div className="hidden md:block">
          {view === "week" ? (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="grid grid-cols-5 border-b border-border bg-surface-muted">
                {days.map((d) => (
                  <div key={d.key} className="px-3 py-3 text-center border-r border-border last:border-r-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.day}</div>
                    <div className="text-sm font-semibold">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 min-h-[420px]">
                {days.map((day) => {
                  const dayAppts = visibleAppts.filter((appt) => appointmentDateKey(appt) === day.key);
                  return (
                    <div key={day.key} className="border-r border-border last:border-r-0 p-2 space-y-2">
                      {dayAppts.length === 0 && <div className="text-[11px] text-muted-foreground/60 text-center py-6">-</div>}
                      {dayAppts.map((appt) => (
                        <Link key={appt.assignmentId} to="/ticket/$id" params={{ id: appt.ticket.id }} className="block rounded-lg border border-border bg-surface hover:border-primary/40 hover:shadow-soft transition-all p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">{appt.ticket.id}</span>
                            <UrgencyBadge urgency={appt.ticket.urgency} />
                          </div>
                          <div className="mt-1 text-xs font-semibold line-clamp-2">{appt.ticket.title[lang]}</div>
                          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {appt.timeLabel[lang]} - {appt.endTimeLabel[lang]}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {appt.ticket.tenant.building.split(",")[0]}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate"><User className="h-2.5 w-2.5" /> {appt.ticket.tenant.name}</div>
                        </Link>
                      ))}
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
                {list.map((appt) => <AppointmentRow key={appt.assignmentId} appointment={appt} lang={lang} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function AppointmentCard({
  appointment,
  lang,
  t,
  editingTicketId,
  nextDate,
  setNextDate,
  beginReschedule,
  submitReschedule,
  startJob,
  busy,
}: {
  appointment: ContractorAppointmentDto;
  lang: "DE" | "EN";
  t: (key: string) => string;
  editingTicketId: string | null;
  nextDate: string;
  setNextDate: (value: string) => void;
  beginReschedule: (appointment: ContractorAppointmentDto) => void;
  submitReschedule: (ticketId: string) => void;
  startJob: (ticketId: string) => void;
  busy: boolean;
}) {
  const tk = appointment.ticket;
  const editing = editingTicketId === tk.id;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold tabular-nums">{appointment.timeLabel[lang]} - {appointment.endTimeLabel[lang]}</span>
            <span className="text-[10px] font-mono text-muted-foreground">· {tk.id}</span>
          </div>
          <div className="mt-1.5 text-sm font-semibold">{tk.title[lang]}</div>
        </div>
        <UrgencyBadge urgency={tk.urgency} />
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{tk.tenant.building}</span></div>
        <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 shrink-0" /><span className="text-foreground">{tk.tenant.name}</span></div>
        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{tk.tenant.phone}</span></div>
      </div>

      {editing && (
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <input type="datetime-local" value={nextDate} onChange={(event) => setNextDate(event.target.value)} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={() => submitReschedule(tk.id)} disabled={busy || !nextDate} className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {busy ? t("common.loading") : (lang === "EN" ? "Save new time" : "Neuen Termin speichern")}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Link to="/ticket/$id" params={{ id: tk.id }} className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">
          {lang === "EN" ? "Open job" : "Auftrag oeffnen"}
        </Link>
        <button onClick={() => startJob(tk.id)} disabled={busy} className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition disabled:opacity-50">
          {lang === "EN" ? "Mark in progress" : "Starten"}
        </button>
        <button onClick={() => beginReschedule(appointment)} disabled={busy} className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs hover:bg-accent transition disabled:opacity-50">
          {lang === "EN" ? "Reschedule" : "Verschieben"}
        </button>
      </div>
    </div>
  );
}

function AppointmentRow({ appointment, lang }: { appointment: ContractorAppointmentDto; lang: "DE" | "EN" }) {
  const tk = appointment.ticket;
  return (
    <Link to="/ticket/$id" params={{ id: tk.id }} className="grid grid-cols-12 px-4 py-3 hover:bg-accent/30 items-center gap-3">
      <div className="col-span-2 text-sm font-semibold tabular-nums">{appointment.timeLabel[lang]}<span className="text-muted-foreground"> - {appointment.endTimeLabel[lang]}</span></div>
      <div className="col-span-5 min-w-0">
        <div className="text-sm font-semibold truncate">{tk.title[lang]}</div>
        <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{tk.tenant.building}</div>
      </div>
      <div className="col-span-3 min-w-0">
        <div className="text-xs flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" />{tk.tenant.name}</div>
        <div className="text-xs flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{tk.tenant.phone}</div>
      </div>
      <div className="col-span-2 flex justify-end"><UrgencyBadge urgency={tk.urgency} /></div>
    </Link>
  );
}
