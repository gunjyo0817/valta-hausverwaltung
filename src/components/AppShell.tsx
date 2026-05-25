import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  Building2,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  Sparkles,
  Plus,
  MessageSquareText,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/inbox", label: "Operations Inbox", icon: Inbox },
  { to: "/properties", label: "Objekte", icon: Building2, disabled: true },
  { to: "/contractors", label: "Handwerker", icon: Users, disabled: true },
  { to: "/analytics", label: "Analytics", icon: BarChart3, disabled: true },
];

const tenantNav = [
  { to: "/intake", label: "Tenant Intake", icon: MessageSquareText },
  { to: "/portal", label: "Tenant Portal", icon: Compass },
];

export function AppShell({ children, title, subtitle, actions }: { children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname.startsWith(to));

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">V</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Valta</div>
            <div className="text-[11px] text-muted-foreground">Operations Copilot</div>
          </div>
        </div>

        <div className="px-3 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hausverwaltung</div>
        <nav className="px-2 space-y-0.5">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.disabled ? "/" : n.to}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                isActive(n.to, n.exact) && !n.disabled
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                n.disabled && "opacity-50 cursor-not-allowed",
              )}
              onClick={(e) => n.disabled && e.preventDefault()}
            >
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
              {n.disabled && <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">soon</span>}
            </Link>
          ))}
        </nav>

        <div className="px-3 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mieter-Sicht (Demo)</div>
        <nav className="px-2 space-y-0.5">
          {tenantNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                isActive(n.to)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-3">
          <div className="rounded-xl border border-border bg-gradient-to-br from-accent to-surface p-3 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-ai" /> AI Copilot
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Strukturiert Anfragen, priorisiert Dringlichkeit und schlägt Handwerker vor.</p>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md p-2 hover:bg-accent">
            <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">SK</div>
            <div className="leading-tight">
              <div className="text-xs font-medium">Sarah Krüger</div>
              <div className="text-[11px] text-muted-foreground">Hausverwaltung Berlin GmbH</div>
            </div>
            <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border glass px-4 md:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground w-72">
              <Search className="h-3.5 w-3.5" />
              <input
                placeholder="Tickets, Mieter, Objekte suchen…"
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </div>
            <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
            {actions ?? (
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition">
                <Plus className="h-3.5 w-3.5" /> Neues Ticket
              </button>
            )}
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
