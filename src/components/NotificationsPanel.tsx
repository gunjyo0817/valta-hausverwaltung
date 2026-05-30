import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  AlertOctagon,
  ImagePlus,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
  RefreshCcw,
  HelpCircle,
  CheckCheck,
  Bell,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/lib/api";
import { useRole } from "@/lib/role";

type NotifType =
  | "critical"
  | "assigned"
  | "photos"
  | "approval"
  | "status"
  | "missing"
  | "ai";

type Notif = {
  id: string;
  type: NotifType;
  title: { DE: string; EN: string };
  desc: { DE: string; EN: string };
  ticketId?: string | null;
  context?: string | null;
  time: { DE: string; EN: string };
  unread: boolean;
  to: { path: string; params?: Record<string, string> | null };
  action: { DE: string; EN: string };
};

const seed: Notif[] = [
  {
    id: "n1",
    type: "critical",
    title: { DE: "Neuer kritischer Fall: Heizungsausfall", EN: "New critical case: Heating failure" },
    desc: { DE: "Komplettausfall der Zentralheizung gemeldet.", EN: "Complete central heating failure reported." },
    ticketId: "VLT-2041",
    context: "Lindenstraße 22",
    time: { DE: "vor 4 Min.", EN: "4 min ago" },
    unread: true,
    to: { path: "/ticket/$id", params: { id: "VLT-2041" } },
    action: { DE: "Ticket öffnen", EN: "Open ticket" },
  },
  {
    id: "n2",
    type: "photos",
    title: { DE: "Mieter hat 2 Fotos hochgeladen", EN: "Tenant uploaded 2 photos" },
    desc: { DE: "Wasserschaden in der Küche", EN: "Water leak in kitchen" },
    ticketId: "VLT-2039",
    context: "Goethestraße 8",
    time: { DE: "vor 18 Min.", EN: "18 min ago" },
    unread: true,
    to: { path: "/ticket/$id", params: { id: "VLT-2039" } },
    action: { DE: "Fotos prüfen", EN: "Review photos" },
  },
  {
    id: "n3",
    type: "approval",
    title: { DE: "Eigentümer-Freigabe erforderlich", EN: "Owner approval needed" },
    desc: { DE: "Heizungsaustausch · € 12.400", EN: "Heating replacement · €12,400" },
    ticketId: "AP-104",
    context: "Lindenstraße 22",
    time: { DE: "vor 1 Std.", EN: "1 h ago" },
    unread: true,
    to: { path: "/owner/approvals" },
    action: { DE: "Freigabe prüfen", EN: "Review approval" },
  },
  {
    id: "n4",
    type: "assigned",
    title: { DE: "Handwerker hat Termin bestätigt", EN: "Contractor confirmed appointment" },
    desc: { DE: "Müller Heizung GmbH · Heute 14:00", EN: "Müller Heizung GmbH · Today 14:00" },
    ticketId: "VLT-2037",
    context: "Parkallee 110",
    time: { DE: "vor 2 Std.", EN: "2 h ago" },
    unread: false,
    to: { path: "/contractor/schedule" },
    action: { DE: "Plan ansehen", EN: "View schedule" },
  },
  {
    id: "n5",
    type: "status",
    title: { DE: "Ticket-Status geändert", EN: "Ticket status changed" },
    desc: { DE: "In Bearbeitung → Wartet auf Mieter", EN: "In progress → Waiting on tenant" },
    ticketId: "VLT-2030",
    context: "Rosenweg 3",
    time: { DE: "vor 3 Std.", EN: "3 h ago" },
    unread: false,
    to: { path: "/ticket/$id", params: { id: "VLT-2030" } },
    action: { DE: "Ticket öffnen", EN: "Open ticket" },
  },
  {
    id: "n6",
    type: "missing",
    title: { DE: "Fehlende Informationen", EN: "Missing information" },
    desc: { DE: "Mieter-Telefonnummer benötigt für Terminabstimmung.", EN: "Tenant phone number required to schedule." },
    ticketId: "VLT-2025",
    context: "Lindenstraße 22",
    time: { DE: "vor 5 Std.", EN: "5 h ago" },
    unread: false,
    to: { path: "/ticket/$id", params: { id: "VLT-2025" } },
    action: { DE: "Ergänzen", EN: "Add details" },
  },
  {
    id: "n7",
    type: "ai",
    title: { DE: "KI-Empfehlung verfügbar", EN: "AI suggestion ready" },
    desc: { DE: "3 ähnliche Fälle deuten auf Ventildefekt hin.", EN: "3 similar cases suggest a valve defect." },
    ticketId: "VLT-2039",
    context: "Goethestraße 8",
    time: { DE: "gestern", EN: "yesterday" },
    unread: false,
    to: { path: "/insights" },
    action: { DE: "Einsicht öffnen", EN: "Open insight" },
  },
];

const meta: Record<NotifType, { icon: any; color: string }> = {
  critical: { icon: AlertOctagon, color: "text-destructive bg-destructive/10" },
  photos: { icon: ImagePlus, color: "text-info bg-info/10" },
  approval: { icon: ShieldCheck, color: "text-warning bg-warning/10" },
  assigned: { icon: CalendarCheck, color: "text-success bg-success/10" },
  status: { icon: RefreshCcw, color: "text-primary bg-primary/10" },
  missing: { icon: HelpCircle, color: "text-muted-foreground bg-muted" },
  ai: { icon: Sparkles, color: "text-ai bg-ai/10" },
};

type Filter = "all" | "unread" | "critical" | "approvals";

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLang();
  const { role } = useRole();
  const navigate = useNavigate();
  const { data } = useNotifications();
  const markOneMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const [items, setItems] = useState<Notif[]>(seed);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "unread": return items.filter((n) => n.unread);
      case "critical": return items.filter((n) => n.type === "critical");
      case "approvals": return items.filter((n) => n.type === "approval");
      default: return items;
    }
  }, [items, filter]);

  if (!open) return null;

  const unreadCount = items.filter((n) => n.unread).length;
  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    markAllMutation.mutate({ data: { role } });
  };
  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    markOneMutation.mutate({ data: { id, role } });
  };

  const handleOpen = (n: Notif) => {
    markRead(n.id);
    onClose();
    navigate({ to: n.to.path as any, params: n.to.params as any });
  };

  const tabs: { key: Filter; label: { DE: string; EN: string }; count?: number }[] = [
    { key: "all", label: { DE: "Alle", EN: "All" }, count: items.length },
    { key: "unread", label: { DE: "Ungelesen", EN: "Unread" }, count: unreadCount },
    { key: "critical", label: { DE: "Kritisch", EN: "Critical" }, count: items.filter((n) => n.type === "critical").length },
    { key: "approvals", label: { DE: "Freigaben", EN: "Approvals" }, count: items.filter((n) => n.type === "approval").length },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/30 animate-in fade-in duration-150" onClick={onClose} />
      <aside
        className={cn(
          "absolute bg-surface border border-border shadow-elegant flex flex-col animate-in",
          // Mobile: full-screen sheet
          "inset-0 md:inset-auto",
          // Desktop: popover-like panel anchored top-right
          "md:top-16 md:right-6 md:bottom-6 md:w-[420px] md:rounded-xl md:slide-in-from-top-2 fade-in duration-200",
        )}
      >
        <div className="flex items-center gap-3 px-4 md:px-5 h-14 border-b border-border shrink-0">
          <Bell className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">{lang === "EN" ? "Notifications" : "Benachrichtigungen"}</div>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold rounded-full bg-destructive/15 text-destructive px-2 py-0.5">
              {unreadCount} {lang === "EN" ? "new" : "neu"}
            </span>
          )}
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {lang === "EN" ? "Mark all read" : "Alle gelesen"}
          </button>
          <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 px-3 md:px-4 pt-3 pb-2 border-b border-border overflow-x-auto shrink-0">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {tab.label[lang]}
                {tab.count !== undefined && (
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {lang === "EN" ? "No notifications." : "Keine Benachrichtigungen."}
            </div>
          )}
          {filtered.map((n) => {
            const Icon = meta[n.type].icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "px-4 md:px-5 py-3.5 flex gap-3 transition-colors hover:bg-accent/30",
                  n.unread && "bg-primary/[0.04]",
                )}
              >
                <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", meta[n.type].color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="text-sm font-semibold leading-tight flex-1">{n.title[lang]}</div>
                    {n.unread && <span className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{n.desc[lang]}</div>
                  {(n.ticketId || n.context) && (
                    <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1.5">
                      {n.ticketId && <span className="font-mono">{n.ticketId}</span>}
                      {n.ticketId && n.context && <span>·</span>}
                      {n.context && <span>{n.context}</span>}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">{n.time[lang]}</span>
                    <button
                      onClick={() => handleOpen(n)}
                      className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium hover:border-primary/40 hover:text-primary transition"
                    >
                      {n.action[lang]}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export function useNotificationsUnread() {
  const { data } = useNotifications();
  return (data ?? seed).filter((n) => n.unread).length;
}
