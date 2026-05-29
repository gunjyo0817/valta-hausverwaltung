import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
  Languages,
  ChevronDown,
  Check,
  Wrench,
  Briefcase,
  Calendar,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  AlertOctagon,
  ClipboardList,
  Home,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useRole, ROLE_HOME, ROLE_META, type Role } from "@/lib/role";
import { useState, useEffect, type ReactNode } from "react";
import { NewTicketModal } from "./NewTicketModal";
import { NotificationsPanel, useNotificationsUnread } from "./NotificationsPanel";

type NavItem = { to: string; label: string; icon: any; exact?: boolean };

export function AppShell({ children, title, subtitle, actions }: { children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname === to || pathname.startsWith(to + "/"));
  const { t, lang, setLang } = useLang();
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const [roleOpen, setRoleOpen] = useState(false);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifUnread = useNotificationsUnread();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, role]);

  const pmNav: NavItem[] = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/inbox", label: t("nav.inbox"), icon: Inbox },
    { to: "/insights", label: t("nav.insights"), icon: BarChart3 },
    { to: "/properties", label: t("nav.properties"), icon: Building2 },
    { to: "/contractors", label: t("nav.contractors"), icon: Users },
  ];
  const tenantNav: NavItem[] = [
    { to: "/tenant", label: lang === "EN" ? "Home" : "Start", icon: Home, exact: true },
    { to: "/tenant/new-request", label: t("tnav.report"), icon: MessageSquareText },
    { to: "/tenant/tickets", label: t("tnav.requests"), icon: ClipboardList },
  ];
  const contractorNav: NavItem[] = [
    { to: "/contractor", label: t("cnav.jobs"), icon: Briefcase, exact: true },
    { to: "/contractor/schedule", label: t("cnav.schedule"), icon: Calendar },
    { to: "/contractor/messages", label: t("cnav.messages"), icon: MessageSquareText },
    { to: "/contractor/completed", label: t("cnav.completed"), icon: CheckCircle2 },
  ];
  const ownerNav: NavItem[] = [
    { to: "/owner", label: t("onav.properties"), icon: Home, exact: true },
    { to: "/owner/issues", label: t("onav.issues"), icon: AlertOctagon },
    { to: "/owner/financials", label: t("onav.financials"), icon: Wallet },
    { to: "/owner/approvals", label: t("onav.approvals"), icon: ShieldCheck },
  ];

  const navByRole: Record<Role, { section: string; items: NavItem[] }> = {
    pm: { section: t("nav.section_hv"), items: pmNav },
    tenant: { section: t("role.tenant_view"), items: tenantNav },
    contractor: { section: t("role.contractor_view"), items: contractorNav },
    owner: { section: t("role.owner_view"), items: ownerNav },
  };

  const meta = ROLE_META[role];
  const current = navByRole[role];

  const handleRoleSwitch = (r: Role) => {
    setRole(r);
    setRoleOpen(false);
    navigate({ to: ROLE_HOME[r] as any });
  };

  const roleViewLabelKey = ({
    pm: "role.pm_view",
    tenant: "role.tenant_view",
    contractor: "role.contractor_view",
    owner: "role.owner_view",
  } as const)[role];

  const roles: Role[] = ["pm", "tenant", "contractor", "owner"];
  const roleIcon: Record<Role, any> = { pm: LayoutDashboard, tenant: MessageSquareText, contractor: Wrench, owner: Home };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <Link to={ROLE_HOME[role] as any} className="flex h-16 items-center gap-2 px-5 border-b border-border hover:bg-accent/40 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">V</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Valta</div>
            <div className="text-[11px] text-muted-foreground">{t("brand.tagline")}</div>
          </div>
        </Link>

        {/* Role badge */}
        <div className="px-3 pt-3">
          <div className={cn("flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs", meta.color)}>
            <div className="h-6 w-6 rounded-md bg-background/60 flex items-center justify-center text-[10px] font-semibold">{meta.initials}</div>
            <div className="leading-tight min-w-0">
              <div className="font-semibold truncate">{t(roleViewLabelKey as any)}</div>
              <div className="text-[10px] opacity-75 truncate">{meta.person[lang]}</div>
            </div>
          </div>
        </div>

        <div className="px-3 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{current.section}</div>
        <nav className="px-2 space-y-0.5 transition-all duration-200" key={role}>
          {current.items.map((n) => (
            <Link
              key={n.to}
              to={n.to as any}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                isActive(n.to, n.exact)
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
            <p className="mt-1 text-xs text-muted-foreground">{t("shell.copilot_blurb")}</p>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md p-2 hover:bg-accent">
            <div className={cn("h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center", meta.color)}>{meta.initials}</div>
            <div className="leading-tight min-w-0">
              <div className="text-xs font-medium truncate">{meta.person[lang]}</div>
              <div className="text-[11px] text-muted-foreground truncate">{meta.org[lang]}</div>
            </div>
            <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border glass px-4 md:px-8">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent -ml-1"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground hidden sm:block">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground w-64">
              <Search className="h-3.5 w-3.5" />
              <input placeholder={t("common.search")} className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </div>

            {/* Role switcher */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setRoleOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
                title={t("role.switch")}
              >
                <span className="hidden sm:inline text-muted-foreground">{t("role.current_view")}:</span>
                <span className="font-semibold">{meta.label[lang]}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {roleOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setRoleOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-lg border border-border bg-surface shadow-elegant overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 border-b border-border bg-gradient-to-r from-accent/40 to-surface">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("role.demo_mode")}</div>
                    </div>
                    {roles.map((r) => {
                      const m = ROLE_META[r];
                      const Icon = roleIcon[r];
                      return (
                        <button
                          key={r}
                          onClick={() => handleRoleSwitch(r)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-accent transition-colors",
                            role === r && "bg-accent/60",
                          )}
                        >
                          <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", m.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{m.label[lang]}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{m.person[lang]}</div>
                          </div>
                          {role === r && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center rounded-md border border-border bg-surface text-[11px] overflow-hidden">
              <button onClick={() => setLang("DE")} className={cn("px-2 py-1.5 inline-flex items-center gap-1", lang === "DE" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent")}>
                <Languages className="h-3 w-3" />DE
              </button>
              <button onClick={() => setLang("EN")} className={cn("px-2 py-1.5", lang === "EN" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent")}>
                EN
              </button>
            </div>
            <button onClick={() => setNotifOpen(true)} className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {notifUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                  {notifUnread}
                </span>
              )}
            </button>
            {actions ?? (role === "pm" ? (
              <button onClick={() => setNewTicketOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition">
                <Plus className="h-3.5 w-3.5" /> {t("act.new_ticket")}
              </button>
            ) : null)}
          </div>
        </header>
        <main className="min-w-0 flex-1 animate-in fade-in duration-200" key={role}>{children}</main>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] bg-surface border-r border-border shadow-elegant flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex h-16 items-center gap-2 px-5 border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">V</div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">Valta</div>
                <div className="text-[11px] text-muted-foreground">{t("brand.tagline")}</div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 pt-3">
              <div className={cn("flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs", meta.color)}>
                <div className="h-6 w-6 rounded-md bg-background/60 flex items-center justify-center text-[10px] font-semibold">{meta.initials}</div>
                <div className="leading-tight min-w-0">
                  <div className="font-semibold truncate">{t(roleViewLabelKey as any)}</div>
                  <div className="text-[10px] opacity-75 truncate">{meta.person[lang]}</div>
                </div>
              </div>
            </div>

            <div className="px-3 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{current.section}</div>
            <nav className="px-2 space-y-0.5 flex-1 overflow-y-auto">
              {current.items.map((n) => (
                <Link
                  key={n.to}
                  to={n.to as any}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors",
                    isActive(n.to, n.exact)
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  <span>{n.label}</span>
                </Link>
              ))}

              <div className="pt-4 pb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("role.demo_mode")}</div>
              {roles.map((r) => {
                const m = ROLE_META[r];
                const Icon = roleIcon[r];
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors",
                      role === r ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", m.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium">{m.label[lang]}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{m.person[lang]}</div>
                    </div>
                    {role === r && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("common.language") || "Language"}</span>
                <div className="flex items-center rounded-md border border-border bg-background text-[11px] overflow-hidden">
                  <button onClick={() => setLang("DE")} className={cn("px-3 py-1.5 inline-flex items-center gap-1", lang === "DE" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground")}>
                    <Languages className="h-3 w-3" />DE
                  </button>
                  <button onClick={() => setLang("EN")} className={cn("px-3 py-1.5", lang === "EN" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground")}>
                    EN
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md p-1">
                <div className={cn("h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center", meta.color)}>{meta.initials}</div>
                <div className="leading-tight min-w-0">
                  <div className="text-xs font-medium truncate">{meta.person[lang]}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{meta.org[lang]}</div>
                </div>
                <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </aside>
        </div>
      )}

      <NewTicketModal open={newTicketOpen} onClose={() => setNewTicketOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
