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
    <Link to="/" aria-label="Insaka home" className="flex items-center gap-2 group shrink-0">
      <img src="/logo.png" alt="Insaka" className="h-9 w-auto object-contain transition group-hover:opacity-90" />
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
    <div className="min-h-screen w-full bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary">
      {/* Floating Top Navbar matching design */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#080808]/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Logo />

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                  <Gift className="h-3.5 w-3.5" />
                  <span>{credits} Credits</span>
                </div>
                <button
                  onClick={openAuthModal}
                  className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/10"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Account</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-black/60 p-1 shadow-lg backdrop-blur">
                <button
                  onClick={openAuthModal}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(229,57,53,0.4)] transition hover:brightness-110"
                >
                  Sign In <span className="text-sm">→</span>
                </button>
                <button
                  aria-label="Open menu"
                  onClick={() => setOpen((prev) => !prev)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[280px] flex-col justify-between border-l border-white/10 bg-[#0C0C0C] p-6 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Logo />
                <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-white/10">
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

      {/* Main Page Area */}
      <main className="w-full">{children}</main>
    </div>
  );
}

