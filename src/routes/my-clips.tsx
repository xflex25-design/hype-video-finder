import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors, Play, Trash2, Clock, Sparkles, LogIn, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { getUserClips, deleteUserClip, type SavedClip } from "@/lib/supabase";

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
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
              >
                <div className="relative aspect-video w-full bg-muted/40">
                  {clip.video_url ? (
                    <video
                      src={clip.video_url}
                      className="h-full w-full object-cover"
                      controls
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/10 to-card">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="absolute left-2.5 top-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    Hype: {Math.round(clip.hype_score * 100)}%
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="line-clamp-1 font-semibold text-foreground">{clip.title}</h3>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{Math.round(clip.duration)}s</span>
                      <span>•</span>
                      <span>{new Date(clip.created_at).toLocaleDateString()}</span>
                    </div>
                    {clip.clip_data?.reason && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {clip.clip_data.reason}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    {clip.source_url ? (
                      <a
                        href={clip.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Original Source
                      </a>
                    ) : (
                      <div />
                    )}
                    <button
                      onClick={() => handleDelete(clip.id)}
                      title="Delete clip"
                      className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
