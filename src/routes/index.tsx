import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Zap, CloudUpload, Link2, FileVideo, X, AudioLines, Sparkles, Smartphone, ShieldCheck, Check, Loader2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { validateFile, validateUrl, formatBytes, formatDuration } from "@/lib/upload";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hype Finder — Turn long videos into viral moments" },
      { name: "description", content: "Find the most exciting, funny and engaging moments in your videos and turn them into vertical Shorts, Reels and TikToks." },
      { property: "og:title", content: "Hype Finder — Turn long videos into viral moments" },
      { property: "og:description", content: "AI-powered video clipping for creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Source =
  | { kind: "file"; file: File; duration?: number; preview: string }
  | { kind: "url"; url: string };

const STAGES = [
  { title: "Analyzing audio", desc: "Detecting loudness spikes, shouting, laughter and crowd noise…" },
  { title: "Finding exciting moments", desc: "Scanning and ranking the best clips…" },
  { title: "Creating Shorts", desc: "Preparing your results…" },
];

function Index() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (progress === null || progress >= 100) return;
    const t = setTimeout(() => setProgress((p) => Math.min(100, (p ?? 0) + 2)), 120);
    return () => clearTimeout(t);
  }, [progress]);

  const processing = progress !== null && progress < 100;

  function pickFile(file?: File) {
    if (!file) return;
    const err = validateFile(file);
    if (err) return setError(err);
    setError(null);
    setUrl("");
    const preview = URL.createObjectURL(file);
    setSource({ kind: "file", file, preview });
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () =>
      setSource((s) => (s?.kind === "file" && s.file === file ? { ...s, duration: v.duration } : s));
    v.src = preview;
  }

  function clear() {
    if (source?.kind === "file") URL.revokeObjectURL(source.preview);
    setSource(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function start() {
    if (source?.kind !== "file") {
      if (!url.trim()) return setError("Choose a video file or paste a direct video link.");
      const err = validateUrl(url);
      if (err) return setError(err);
      setSource({ kind: "url", url: url.trim() });
    }
    setError(null);
    setProgress(0);
  }

  const stageIdx = progress === null ? -1 : progress >= 100 ? 3 : Math.floor(progress / 34);

  return (
    <AppShell>
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3.5 w-3.5 fill-primary text-primary" /> AI-Powered Video Clipping
          </span>
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Turn long videos
              <br />
              into <span className="text-primary">viral moments.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Find the most exciting, funny and engaging moments in your videos — automatically.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-primary/50 bg-card p-4 sm:p-6">
            {source?.kind === "file" ? (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-elevated p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15">
                  <FileVideo className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{source.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(source.file.size)}
                    {source.duration ? ` • ${formatDuration(source.duration)}` : ""}
                  </p>
                </div>
                {!processing && (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => inputRef.current?.click()} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                      Replace
                    </button>
                    <button aria-label="Remove video" onClick={clear} className="grid h-10 w-10 place-items-center rounded-lg border border-border hover:bg-accent">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-xl py-10 transition-colors",
                  drag ? "bg-primary/10" : "hover:bg-accent/50",
                )}
              >
                <CloudUpload className="h-14 w-14 text-primary" />
                <span className="text-lg font-bold">Drop your video file here</span>
                <span className="text-sm text-muted-foreground">or click to browse</span>
              </button>
            )}
            <input ref={inputRef} type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />

            {source?.kind !== "file" && (
              <>
                <div className="my-4 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={url}
                    disabled={processing}
                    onChange={(e) => { setUrl(e.target.value); setError(null); }}
                    placeholder="Paste a direct video link (e.g. https://example.com/video.mp4)"
                    className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>
              </>
            )}

            {error && <p role="alert" className="mt-3 text-sm text-primary-glow">{error}</p>}

            <button
              onClick={start}
              disabled={processing}
              className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-current" />}
              {processing ? "Finding your hype…" : "Find My Hype"}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Supports MP4, MOV, WEBM • Max file size: 2 GB</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">Only upload videos you own or have permission to edit and publish.</p>
          </div>

          {progress !== null && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold">{progress >= 100 ? "Analysis complete" : "Analyzing your video…"}</h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {source?.kind === "file" ? source.file.name : source?.kind === "url" ? source.url : ""}
                  </p>
                </div>
                <span className="shrink-0 font-bold text-primary">{progress}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <ol className="mt-5 grid gap-4 sm:grid-cols-3">
                {STAGES.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border", i < stageIdx ? "border-primary bg-primary text-primary-foreground" : i === stageIdx ? "border-primary text-primary" : "border-border text-muted-foreground")}>
                      {i < stageIdx ? <Check className="h-4 w-4" /> : i === stageIdx ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {progress >= 100 && (
                <p className="mt-5 rounded-xl border border-border bg-elevated p-4 text-sm text-muted-foreground">
                  This is a preview of the processing flow. Real clip detection and downloads come in the next step.
                </p>
              )}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">How It Works</h2>
          <ol className="mt-6 space-y-6">
            {[
              { icon: AudioLines, t: "We analyze your video", d: "Detects loudness spikes, shouting, laughter, crowd noise and more." },
              { icon: Sparkles, t: "Finds the best moments", d: "Ranks clips by energy and engagement." },
              { icon: Smartphone, t: "Creates short clips", d: "15–45 seconds, vertical 9:16, with captions (when available)." },
            ].map((s, i) => (
              <li key={s.t} className="flex items-start gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <p className="font-semibold">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border p-4 text-sm text-muted-foreground">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
            Only use videos you own or have permission to clip.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
