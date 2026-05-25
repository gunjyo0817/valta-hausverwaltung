import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { tickets } from "@/lib/mockData";
import { UrgencyBadge } from "@/components/Badges";
import { Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/contractor/schedule")({ component: Schedule });

const days = [
  { de: "Mo", en: "Mon", date: "25.05" },
  { de: "Di", en: "Tue", date: "26.05" },
  { de: "Mi", en: "Wed", date: "27.05" },
  { de: "Do", en: "Thu", date: "28.05" },
  { de: "Fr", en: "Fri", date: "29.05" },
];

function Schedule() {
  const { t, lang } = useLang();
  const jobs = tickets.filter((tk) => tk.status !== "resolved").slice(0, 5);

  return (
    <AppShell title={t("cdash.schedule_title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8">
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-5 border-b border-border bg-accent/30">
            {days.map((d) => (
              <div key={d.date} className="px-3 py-3 text-center border-r border-border last:border-r-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{lang === "DE" ? d.de : d.en}</div>
                <div className="text-sm font-semibold">{d.date}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 min-h-[380px]">
            {days.map((d, i) => (
              <div key={d.date} className="border-r border-border last:border-r-0 p-2 space-y-2">
                {jobs[i] && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">{jobs[i].id}</span>
                      <UrgencyBadge urgency={jobs[i].urgency} />
                    </div>
                    <div className="mt-1 text-xs font-medium line-clamp-2">{jobs[i].title[lang]}</div>
                    <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> 09:00 – 11:00</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {jobs[i].tenant.building.split(",")[0]}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
