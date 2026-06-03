import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { useLang } from "@/lib/i18n";
import { StatusBadge } from "@/components/Badges";
import { MessageSquareText, ArrowRight, Camera, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { useTickets } from "@/lib/api";
import { isDemoTenantTicket } from "@/lib/tenant-demo";

export const Route = createFileRoute("/tenant/")({ component: TenantHome });

function TenantHome() {
  const { t, lang } = useLang();
  const ticketsQuery = useTickets();
  const tickets = ticketsQuery.data ?? [];
  const mine = tickets.filter(isDemoTenantTicket).slice(0, 4);
  const active = mine.filter((tk) => tk.status !== "resolved");
  const resolved = mine.filter((tk) => tk.status === "resolved");

  return (
    <AppShell title={t("tdash.title")} subtitle={t("tdash.sub")}>
      <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
        {ticketsQuery.isError && (
          <DataErrorState
            title={lang === "EN" ? "Requests could not be loaded" : "Anfragen konnten nicht geladen werden"}
            description={lang === "EN" ? "The tenant dashboard request failed. This is different from an intentionally empty demo database." : "Die Abfrage des Mieter-Dashboards ist fehlgeschlagen. Das ist etwas anderes als eine absichtlich leere Demo-Datenbank."}
          />
        )}
        {/* Hero CTA */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-info/5 to-surface p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold tracking-tight">{t("tdash.hero_title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("tdash.hero_sub")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/tenant/new-request" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
                  <MessageSquareText className="h-4 w-4" /> {t("tdash.new_request")}
                </Link>
                <Link to="/tenant/tickets" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:bg-accent transition">
                  <Clock className="h-4 w-4" /> {t("tnav.timeline")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Active requests */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">{t("tdash.active")} <span className="text-xs text-muted-foreground font-normal">· {active.length}</span></h3>
          {active.length === 0 ? (
            mine.length === 0 && !ticketsQuery.isLoading ? (
              <EmptyDataState
                title={lang === "EN" ? "No tenant requests" : "Keine Mieteranfragen"}
                description={lang === "EN" ? "The demo data has no tenant ticket records. New requests still work, or you can reload mock data from the admin page." : "Die Demo-Daten enthalten keine Mieter-Tickets. Neue Anfragen funktionieren weiterhin, oder du laedst Mock-Daten im Adminbereich neu."}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
                {t("tdash.no_active")}
              </div>
            )
          ) : (
            <div className="space-y-2">
              {active.map((tk) => (
                <Link key={tk.id} to="/tenant/tickets/$id" params={{ id: tk.id }} className="block rounded-xl border border-border bg-surface p-4 hover:border-primary/40 hover:shadow-soft transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-muted-foreground">
                      <Camera className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{tk.title[lang]}</div>
                          <div className="text-[11px] text-muted-foreground">{tk.id} · {t("tdash.opened")} {tk.createdAt[lang]}</div>
                        </div>
                        <StatusBadge status={tk.status} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{tk.summary[lang]}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tk.contractorName ?? "—"}</span>
                        <span className="inline-flex items-center gap-1 text-primary font-medium">{t("tdash.view")} <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Resolved */}
        {resolved.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-3">{t("tdash.resolved")}</h3>
            <div className="space-y-2">
              {resolved.map((tk) => (
                <Link key={tk.id} to="/tenant/tickets/$id" params={{ id: tk.id }} className="block rounded-xl border border-border bg-surface/50 p-4 hover:border-primary/30 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{tk.title[lang]}</div>
                      <div className="text-[11px] text-muted-foreground">{tk.id} · {tk.createdAt[lang]}</div>
                    </div>
                    <StatusBadge status={tk.status} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-xl border border-border bg-accent/30 p-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" /> {t("intake.privacy")}
        </div>
      </div>
    </AppShell>
  );
}
