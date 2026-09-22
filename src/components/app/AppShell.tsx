import { Link } from "@tanstack/react-router";
import { CalendarCheck, History, Settings, Target, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/today", label: "Aujourd'hui", icon: CalendarCheck },
  { to: "/progression", label: "Progression", icon: TrendingUp },
  { to: "/historique", label: "Historique", icon: History },
  { to: "/tests", label: "Tests", icon: Target },
  { to: "/parametres", label: "Réglages", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background grid-backdrop">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/today" className="font-display text-sm font-bold tracking-[0.2em] text-primary">
            ASCEND
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                activeProps={{ className: "bg-surface text-foreground" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur sm:hidden">
        <div className="flex">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
