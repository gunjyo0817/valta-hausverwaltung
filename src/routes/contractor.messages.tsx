import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { MessageSquareText } from "lucide-react";

export const Route = createFileRoute("/contractor/messages")({ component: Messages });

const threads = [
  { id: 1, from: "Sarah Krüger · HV Berlin", at: "09:14", subject: { DE: "VLT-2041 · Bitte ETA bestätigen", EN: "VLT-2041 · Please confirm ETA" }, preview: { DE: "Hallo, können Sie Lindenstraße 22 heute bis 13:00 anfahren?", EN: "Hi, can you reach Lindenstraße 22 by 13:00 today?" }, unread: true },
  { id: 2, from: "AI Copilot · Valta", at: "08:55", subject: { DE: "Neuer Auftrag automatisch zugewiesen", EN: "New job auto-assigned" }, preview: { DE: "VLT-2039 · Wasserschaden in München. Mieterfotos angehängt.", EN: "VLT-2039 · Water leak in Munich. Tenant photos attached." }, unread: true },
  { id: 3, from: "Hausverwaltung Frankfurt", at: "Gestern", subject: { DE: "Rechnung VLT-2010 freigegeben", EN: "Invoice VLT-2010 approved" }, preview: { DE: "Vielen Dank für die schnelle Bearbeitung.", EN: "Thanks for the fast turnaround." }, unread: false },
];

function Messages() {
  const { t, lang } = useLang();
  return (
    <AppShell title={t("cdash.messages_title")} subtitle={t("cdash.sub")}>
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {threads.map((th) => (
            <div key={th.id} className="p-4 hover:bg-accent/30 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-muted-foreground shrink-0">
                  <MessageSquareText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium truncate">{th.from}</div>
                    <div className="text-[11px] text-muted-foreground shrink-0">{th.at}</div>
                  </div>
                  <div className="text-sm mt-0.5">{th.subject[lang]} {th.unread && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{th.preview[lang]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
