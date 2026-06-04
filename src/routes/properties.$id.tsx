import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataErrorState, EmptyDataState } from "@/components/DataState";
import { StatusBadge, UrgencyBadge } from "@/components/Badges";
import { useLang } from "@/lib/i18n";
import { useAddDocumentMetadata, useProperty, useTickets } from "@/lib/api";
import { ArrowLeft, Building2, MapPin, Users, Sparkles, FileText, Download, MessageSquareText, ArrowUpRight, Wrench, ChevronRight, Upload } from "lucide-react";
import { demoUploadErrorMessage, demoUploadFiles } from "@/lib/demoUpload";
import { isOpenTicket } from "@/lib/ticketStatus";

export const Route = createFileRoute("/properties/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Valta` },
      { name: "description", content: "Property detail view with units, tenants and AI summary." },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = useParams({ from: "/properties/$id" });
  const propertyQuery = useProperty(id);
  const ticketsQuery = useTickets();
  const p = propertyQuery.data;
  const tickets = ticketsQuery.data ?? [];
  const { t, lang } = useLang();
  const addDocument = useAddDocumentMetadata();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  if (propertyQuery.isError || ticketsQuery.isError) {
    return (
      <AppShell title={lang === "EN" ? "Property unavailable" : "Objekt nicht verfuegbar"}>
        <div className="p-4 md:p-8">
          <DataErrorState
            title={lang === "EN" ? "Property data could not be loaded" : "Objektdaten konnten nicht geladen werden"}
            description={lang === "EN" ? "The backend read failed. This is different from an empty demo database." : "Die Backend-Abfrage ist fehlgeschlagen. Das ist etwas anderes als eine leere Demo-Datenbank."}
          />
        </div>
      </AppShell>
    );
  }
  if (!p) {
    return (
      <AppShell title={propertyQuery.isLoading ? "Loading" : "Not found"}>
        <div className="p-4 md:p-8">
          <EmptyDataState
            title={propertyQuery.isLoading ? (lang === "EN" ? "Loading property" : "Objekt wird geladen") : (lang === "EN" ? "Property not found" : "Objekt nicht gefunden")}
            description={propertyQuery.isLoading ? (lang === "EN" ? "Waiting for the backend response." : "Warte auf die Backend-Antwort.") : (lang === "EN" ? "This property record is not present in the database. It may have been cleared from the demo data." : "Dieser Objekt-Datensatz ist nicht in der Datenbank vorhanden. Er wurde moeglicherweise aus den Demo-Daten geloescht.")}
          />
        </div>
      </AppShell>
    );
  }
  const open = tickets.filter((tk) => tk.propertyId === p.id && isOpenTicket(tk));
  const all = tickets.filter((tk) => tk.propertyId === p.id);
  const addPropertyDocumentMetadata = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    setUploadError(null);
    setUploadMessage(null);
    try {
      const uploaded = await demoUploadFiles(selected, { kind: "document" });
      for (const file of uploaded) {
        await addDocument.mutateAsync({
          data: {
            scope: "property",
            targetId: p.id,
            name: file.name,
            type: file.type || "document",
            url: file.url,
            role: "pm",
          },
        });
      }
      setUploadMessage(lang === "EN" ? "Document uploaded." : "Dokument hochgeladen.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadError(demoUploadErrorMessage(error, lang));
    }
  };

  return (
    <AppShell title={p.name} subtitle={p.address}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/properties" className="hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" />{t("act.back_to_properties")}</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{p.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addPropertyDocumentMetadata(event.dataTransfer.files);
              }}
              className="rounded-2xl border border-border bg-surface p-5 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold tracking-tight">{p.name}</h2>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{p.address}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.type[lang]} · {lang === "EN" ? "Built" : "Baujahr"} {p.yearBuilt}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label={t("prop.units")} value={String(p.units)} />
                <Stat label={t("common.open_tickets")} value={String(open.length)} />
                <Stat label={t("prop.manager")} value={p.manager} />
                <Stat label={t("prop.avg_response")} value={`${p.avgResponseMin} ${t("common.minutes_short")}`} />
              </div>
              <div className="mt-5 rounded-xl ai-gradient p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-ai" /> {t("common.ai_summary_property")}
                </div>
                <p className="mt-2 text-sm leading-relaxed">{p.aiSummary[lang]}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface shadow-soft">
              <header className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-semibold">{lang === "EN" ? "Open maintenance tickets" : "Offene Wartungs-Tickets"}</h3>
                <Link to="/inbox" className="text-xs text-primary hover:underline">{t("act.view_all")} →</Link>
              </header>
              <ul className="divide-y divide-border">
                {open.length === 0 && <li className="p-6 text-xs text-muted-foreground text-center">{lang === "EN" ? "No open tickets — all good here." : "Keine offenen Tickets – alles im grünen Bereich."}</li>}
                {open.map((tk) => (
                  <li key={tk.id}>
                    <Link to="/ticket/$id" params={{ id: tk.id }} className="flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center"><Wrench className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">{tk.id}</span>
                          <UrgencyBadge urgency={tk.urgency} />
                        </div>
                        <div className="text-sm font-medium truncate mt-0.5">{tk.title[lang]}</div>
                        <div className="text-xs text-muted-foreground truncate">{tk.tenant.name} · {tk.tenant.apartment[lang]}</div>
                      </div>
                      <StatusBadge status={tk.status} />
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface shadow-soft">
              <header className="flex items-center gap-2 p-4 border-b border-border">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("common.units")} & {t("common.tenants")}</h3>
              </header>
              <ul className="divide-y divide-border">
                {p.unitsList.map((u) => (
                  <li key={u.label} className="flex items-center gap-3 p-3 text-sm">
                    <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-[11px] text-muted-foreground">{u.label.split(",")[0].replace("WE ", "").replace("Unit ", "")}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{u.tenant}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.label}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{u.status[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("prop.recent_communication")}</h3>
              </div>
              <ul className="space-y-3 text-xs">
                {all.slice(0, 4).map((tk) => (
                  <li key={tk.id} className="leading-snug">
                    <div className="text-muted-foreground">{tk.createdAt[lang]} · {tk.tenant.name}</div>
                    <div className="text-foreground">{tk.title[lang]}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("common.documents")}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{t("prop.documents_sub")}</p>
              {uploadError && <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">{uploadError}</div>}
              {uploadMessage && <div className="mb-3 rounded-md bg-success/10 px-2.5 py-2 text-xs text-success-foreground">{uploadMessage}</div>}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => void addPropertyDocumentMetadata(event.target.files)}
              />
              <ul className="space-y-2">
                {p.documents.map((d) => (
                  <li key={d.name} className="flex items-center gap-2 text-xs rounded-md border border-border bg-background px-2.5 py-2 hover:bg-accent transition-colors">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground">{d.type} · {d.updated}</div>
                    </div>
                    <a href={d.url ?? "#"} target={d.url ? "_blank" : undefined} rel="noreferrer" className="inline-flex" aria-label={d.name}>
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={addDocument.isPending}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {addDocument.isPending ? t("common.loading") : (lang === "EN" ? "Upload document" : "Dokument hochladen")}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}
