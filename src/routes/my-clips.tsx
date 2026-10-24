import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors, Trash2, Clock, Sparkles, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { getUserClips, deleteUserClip, type SavedClip } from "@/lib/supabase";
import { ViralScoreCard } from "@/components/ViralScoreCard";

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
  component: MyClipsPage,
});

function MyClipsPage() {
  const { user, openAuthModal } = useAuth();
  const [clips, setClips] = useState<SavedClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClip, setActiveClip] = useState<SavedClip | null>(null);

  useEffect(() => {
    loadClips();
  }, [user]);

  async function loadClips() {
    setLoading(true);
    try {
      const data = await getUserClips(user?.id || "anonymous");
      setClips(data);
    } catch (e) {
      console.error("Failed to load clips:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this clip?")) return;
    const ok = await deleteUserClip(id);
    if (ok) {
      setClips((prev) => prev.filter((c) => c.id !== id));
      if (activeClip?.id === id) setActiveClip(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">My Clips</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your library of saved viral shorts and moments.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
          >
            <Scissors className="h-4 w-4" />
            Find New Hype
          </Link>
        </div>

        {!user && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Save your clips permanently</p>
                <p className="text-xs text-muted-foreground">
                  Sign in or create a free account to sync clips to your cloud library.
                </p>
              </div>
            </div>
            <button
              onClick={openAuthModal}
              className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110"
            >
              Sign in
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-12 text-center text-sm text-muted-foreground">Loading your clips...</div>
        ) : clips.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Scissors className="h-10 w-10 text-primary" />
            <p className="mt-4 font-semibold text-foreground">No clips yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a YouTube link or upload a video file to generate your first viral moments.
            </p>
            <Link
              to="/"
              className="mt-6 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
            >
              Start Clipping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="grid md:grid-cols-[300px_1fr] gap-6 overflow-hidden rounded-2xl border border-border bg-card p-4"
              >
                <div className="relative">
                  {clip.video_url ? (
                    <video
                      src={clip.video_url}
                      className="aspect-[9/16] w-full rounded-xl bg-background object-cover"
                      controls
                    />
                  ) : (
                    <div className="aspect-[9/16] w-full rounded-xl grid place-items-center bg-gradient-to-br from-primary/10 to-card">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  {clip.viralScore && (
                    <div className="absolute top-3 right-3 w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg" style={{ backgroundColor: clip.viralScore.score >= 80 ? "#E53935" : clip.viralScore.score >= 50 ? "#FB8C00" : "#757575" }}>
                      {clip.viralScore.score}/100
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">{clip.title}</h3>
                      <button
                        onClick={() => handleDelete(clip.id)}
                        title="Delete clip"
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {clip.viralScore && (
                      <ViralScoreCard score={clip.viralScore.score} label={clip.viralScore.label} reasons={clip.viralScore.reasons} />
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {Math.round(clip.duration)}s</div>
                      <div>{new Date(clip.created_at).toLocaleDateString()}</div>
                      {clip.source_url && (
                        <a href={clip.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" /> Original Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
