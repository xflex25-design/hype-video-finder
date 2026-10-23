import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Scissors, HelpCircle, Zap, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/my-clips", label: "My Clips", icon: Scissors },
  { to: "/help", label: "Help", icon: HelpCircle },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <Zap className="h-7 w-7 shrink-0 fill-primary text-primary" />
      <span className="font-display text-xl font-extrabold tracking-tight">
        Hype <span className="text-primary">Finder</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => {
        const active = path === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Tagline() {
  return (
    <div className="flex items-start gap-3 text-sm text-muted-foreground">
      <Zap className="mt-0.5 h-5 w-5 shrink-0 fill-primary text-primary" />
      <p>
        Turn long videos into <span className="font-semibold text-primary">viral moments.</span>
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <div className="space-y-8">
          <Logo />
          <NavLinks />
        </div>
        <Tagline />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-border"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[260px] flex-col justify-between border-r border-sidebar-border bg-sidebar p-5">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Logo />
                  <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <Tagline />
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
