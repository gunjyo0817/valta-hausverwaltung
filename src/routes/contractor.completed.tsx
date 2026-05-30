import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { CheckCircle2, Clock, Star, Briefcase, MapPin, User } from "lucide-react";
import { useTickets } from "@/lib/api";

export const Route = createFileRoute("/contractor/completed")({ component: Completed });

type Job = {
  id: string;
  title: { DE: string; EN: string };
  category: { DE: string; EN: string };
  property: string;
  tenant: string;
  completedAt: { DE: string; EN: string };
  durationHours: number;
  rating: number;
};

const jobs: Job[] = [
  { id: "VLT-2025", title: { DE: "Treppenhausbeleuchtung defekt", EN: "Stairwell lighting broken" }, category: { DE: "Beleuchtung", EN: "Lighting" }, property: "Lindenstraße 22, Berlin", tenant: "Jonas Richter", completedAt: { DE: "vor 3 Tagen", EN: "3 days ago" }, durationHours: 0.8, rating: 5 },
  { id: "VLT-2019", title: { DE: "Wasserhahn tropft – Küche", EN: "Dripping tap — kitchen" }, category: { DE: "Sanitär", EN: "Plumbing" }, property: "Goethestraße 8, München", tenant: "Mehmet Yilmaz", completedAt: { DE: "vor 4 Tagen", EN: "4 days ago" }, durationHours: 1.5, rating: 5 },
  { id: "VLT-2014", title: { DE: "Heizkörper entlüften", EN: "Bleed radiator" }, category: { DE: "Heizung", EN: "Heating" }, property: "Lindenstraße 22, Berlin", tenant: "Anna Becker", completedAt: { DE: "vor 5 Tagen", EN: "5 days ago" }, durationHours: 1.0, rating: 5 },
  { id: "VLT-2010", title: { DE: "Siphon getauscht", EN: "Replaced siphon" }, category: { DE: "Sanitär", EN: "Plumbing" }, property: "Goethestraße 8, München", tenant: "Mehmet Yilmaz", completedAt: { DE: "vor 1 Woche", EN: "1 week ago" }, durationHours: 2.2, rating: 4 },
  { id: "VLT-2008", title: { DE: "Thermostat ersetzt", EN: "Replaced thermostat" }, category: { DE: "Heizung", EN: "Heating" }, property: "Parkallee 110, Hamburg", tenant: "Sophia Klein", completedAt: { DE: "vor 1 Woche", EN: "1 week ago" }, durationHours: 1.2, rating: 5 },
  { id: "VLT-1998", title: { DE: "Sicherung erneuert", EN: "Fuse replaced" }, category: { DE: "Elektrik", EN: "Electrical" }, property: "Frankfurter Allee 88, Frankfurt", tenant: "Elena Fischer", completedAt: { DE: "vor 2 Wochen", EN: "2 weeks ago" }, durationHours: 0.5, rating: 5 },
  { id: "VLT-1986", title: { DE: "Tür Schließanlage justiert", EN: "Door lock adjusted" }, category: { DE: "Schließanlage", EN: "Locks" }, property: "Rosenweg 3, Leipzig", tenant: "Clara Hoffmann", completedAt: { DE: "vor 3 Wochen", EN: "3 weeks ago" }, durationHours: 1.0, rating: 4 },
];

function Completed() {
  const { t, lang } = useLang();
  const { data } = useTickets();
  const completedTickets = (data ?? []).filter((ticket) => ticket.status === "resolved");
  const displayJobs: Job[] = completedTickets.length > 0
    ? completedTickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        category: ticket.category,
        property: ticket.tenant.building,
        tenant: ticket.tenant.name,
        completedAt: { DE: "jetzt", EN: "now" },
        durationHours: 1.2,
        rating: 5,
      }))
    : jobs;

  const total = displayJobs.length;
  const avgHours = (displayJobs.reduce((s, j) => s + j.durationHours, 0) / total).toFixed(1);
  const avgRating = (displayJobs.reduce((s, j) => s + j.rating, 0) / total).toFixed(1);
  const onTime = Math.round((displayJobs.filter((j) => j.rating >= 4).length / total) * 100);

  return (
    <AppShell title={t("cdash.completed_title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lang === "EN" ? "Total completed" : "Insgesamt erledigt", value: total, icon: Briefcase, color: "text-primary bg-primary/10" },
            { label: lang === "EN" ? "Avg. duration" : "Ø Dauer", value: `${avgHours} h`, icon: Clock, color: "text-info bg-info/10" },
            { label: lang === "EN" ? "Avg. rating" : "Ø Bewertung", value: avgRating, icon: Star, color: "text-warning bg-warning/10" },
            { label: lang === "EN" ? "On-time rate" : "Termintreue", value: `${onTime}%`, icon: CheckCircle2, color: "text-success bg-success/10" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${k.color}`}><k.icon className="h-4 w-4" /></div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">{lang === "EN" ? "Repair" : "Reparatur"}</div>
            <div className="col-span-2">{t("common.category")}</div>
            <div className="col-span-3">{t("common.property")}</div>
            <div className="col-span-1">{lang === "EN" ? "Duration" : "Dauer"}</div>
            <div className="col-span-1">{lang === "EN" ? "Rating" : "Bewertung"}</div>
            <div className="col-span-1 text-right">{lang === "EN" ? "Done" : "Erledigt"}</div>
          </div>
          {displayJobs.map((j) => (
            <div key={j.id} className="grid grid-cols-12 px-4 py-3 items-center border-b border-border last:border-b-0 hover:bg-accent/30">
              <div className="col-span-1 text-[11px] font-mono text-muted-foreground">{j.id}</div>
              <div className="col-span-3 min-w-0">
                <div className="text-sm font-semibold truncate">{j.title[lang]}</div>
                <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><User className="h-3 w-3" />{j.tenant}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">{j.category[lang]}</div>
              <div className="col-span-3 text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{j.property}</div>
              <div className="col-span-1 text-xs tabular-nums">{j.durationHours} h</div>
              <div className="col-span-1 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < j.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <div className="col-span-1 text-right text-[11px] text-muted-foreground">{j.completedAt[lang]}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
