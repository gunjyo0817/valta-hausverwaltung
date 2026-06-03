import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Database, RefreshCw, RotateCcw } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type DataStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  className?: string;
};

export function EmptyDataState({
  icon: Icon = Database,
  title,
  description,
  actionLabel,
  className,
}: DataStateProps) {
  const { lang } = useLang();
  const label = actionLabel ?? (lang === "EN" ? "Open demo data admin" : "Demo-Daten-Admin oeffnen");

  return (
    <div className={cn("rounded-xl border border-dashed border-border bg-surface p-8 text-center", className)}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
      <Link
        to={"/admin/demo-data" as any}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {label}
      </Link>
    </div>
  );
}

export function DataErrorState({
  title,
  description,
  actionLabel,
  className,
}: Omit<DataStateProps, "icon">) {
  const { lang } = useLang();
  const label = actionLabel ?? (lang === "EN" ? "Try again" : "Erneut versuchen");

  return (
    <div className={cn("rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center", className)}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <RefreshCw className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-semibold text-destructive">{title}</div>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {label}
      </button>
    </div>
  );
}
