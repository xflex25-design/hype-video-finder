import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

const faqs = [
  { q: "Which formats are supported?", a: "MP4, MOV and WEBM files up to 2 GB." },
  { q: "Can I paste a YouTube link?", a: "No. Please paste a direct link to a video file (ending in .mp4, .mov or .webm), or upload the file." },
  { q: "How long are the clips?", a: "Clips are 15–45 seconds, vertical 9:16, ready for Shorts, Reels and TikTok." },
  { q: "What videos can I upload?", a: "Only videos you own or have permission to edit and publish." },
];

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQ — Hype Finder" },
      { name: "description", content: "Answers to common questions about Hype Finder." },
      { property: "og:title", content: "Help & FAQ — Hype Finder" },
      { property: "og:description", content: "Answers to common questions about Hype Finder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Help</h1>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card p-5">
              <summary className="cursor-pointer font-semibold marker:text-primary">{f.q}</summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </AppShell>
  ),
});
