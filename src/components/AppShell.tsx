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
    <Link to="/" aria-label="Insaka home" className="block w-[160px] max-w-full">
      <img src="/logo.png" alt="Insaka" className="h-[50px] w-full object-contain bg-sidebar rounded-lg p-1" />
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

import { useAuth } from "@/contexts/AuthContext";
import { User, LogIn, LogOut, Gift } from "lucide-react";

function UserProfileWidget() {
  const { user, profile, credits, openAuthModal, signOut } = useAuth();

  if (!user) {
    return (
      <div className="space-y-2">
        <button
          onClick={openAuthModal}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
        >
          <LogIn className="h-4 w-4" />
          Sign in - It's FREE
        </button>
      </div>
    );
  }

  const name = profile?.full_name || user.email?.split("@")[0] || "Creator";

  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {name[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{name}</p>
            <p className="text-[10px] text-muted-foreground">{credits} Credits</p>
          </div>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, credits, openAuthModal } = useAuth();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <div className="space-y-6">
          <Logo />
          <NavLinks />
        </div>
        <div className="space-y-4">
          <UserProfileWidget />
          <Tagline />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Gift className="h-3.5 w-3.5" />
                <span>{credits} Credits</span>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 rounded-xl bg-gradient-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
              >
                Sign up - It's FREE
              </button>
            )}
          </div>
        </header>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[260px] flex-col justify-between border-r border-sidebar-border bg-sidebar p-5">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Logo />
                  <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="space-y-4">
                <UserProfileWidget />
                <Tagline />
              </div>
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

