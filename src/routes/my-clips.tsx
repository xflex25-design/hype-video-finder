import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/my-clips")({
  head: () => ({
    meta: [
      { title: "My Clips — Hype Finder" },
      { name: "description", content: "Your library of generated short clips." },
      { property: "og:title", content: "My Clips — Hype Finder" },
      { property: "og:description", content: "Your library of generated short clips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">My Clips</h1>
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Scissors className="h-10 w-10 text-primary" />
          <p className="mt-4 font-semibold">No clips yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload a video to find your first hype moments.</p>
          <Link to="/" className="mt-6 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow">
            Upload a video
          </Link>
        </div>
      </div>
    </AppShell>
  ),
});
