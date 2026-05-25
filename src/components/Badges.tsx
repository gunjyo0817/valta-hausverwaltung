import { cn } from "@/lib/utils";
import type { TicketStatus, Urgency } from "@/lib/mockData";
import { Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";

const statusKey: Record<TicketStatus, "status.new" | "status.waiting" | "status.in_progress" | "status.contractor_assigned" | "status.resolved"> = {
  new: "status.new",
  waiting: "status.waiting",
  in_progress: "status.in_progress",
  contractor_assigned: "status.contractor_assigned",
  resolved: "status.resolved",
};

const statusStyle: Record<TicketStatus, { cls: string; dot: string }> = {
  new: { cls: "bg-info/10 text-info-foreground", dot: "bg-info" },
  waiting: { cls: "bg-warning/15 text-warning-foreground", dot: "bg-warning" },
  in_progress: { cls: "bg-primary/10 text-primary", dot: "bg-primary" },
  contractor_assigned: { cls: "bg-accent text-accent-foreground", dot: "bg-ai" },
  resolved: { cls: "bg-success/15 text-success-foreground", dot: "bg-success" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useLang();
  const s = statusStyle[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {t(statusKey[status])}
    </span>
  );
}

const urgencyKey: Record<Urgency, "urgency.low" | "urgency.medium" | "urgency.high" | "urgency.critical"> = {
  low: "urgency.low",
  medium: "urgency.medium",
  high: "urgency.high",
  critical: "urgency.critical",
};

const urgencyStyle: Record<Urgency, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning-foreground",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const { t } = useLang();
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", urgencyStyle[urgency])}>
      {t(urgencyKey[urgency])}
    </span>
  );
}

export function AIBadge({ confidence }: { confidence: number }) {
  const tone = confidence >= 90 ? "text-success-foreground bg-success/15" : confidence >= 75 ? "text-ai bg-ai/10" : "text-warning-foreground bg-warning/15";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", tone)}>
      <Sparkles className="h-3 w-3" />
      AI · {confidence}%
    </span>
  );
}
