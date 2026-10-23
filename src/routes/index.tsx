import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Zap, CloudUpload, Link2, FileVideo, X, AudioLines, Sparkles, Smartphone, ShieldCheck, Check, Loader2,
  Download, RotateCcw, AlertTriangle, Flame,
} from "lucide-react";
import type { Progress, ResultClip, Stage } from "@/lib/hype-processor";
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

const STAGES: { id: Stage; title: string }[] = [
  { id: "upload", title: "Uploading video" },
  { id: "audio", title: "Analyzing audio" },
  { id: "moments", title: "Finding exciting moments" },
  { id: "clips", title: "Creating vertical clips" },
  { id: "downloads", title: "Preparing downloads" },
];

const fmtT = (t: number) => formatDuration(t);

function Index() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [clips, setClips] = useState<ResultClip[]>([]);
  const [zipping, setZipping] = useState(false);
  const running = useRef(false);

  useEffect(() => () => clips.forEach((c) => URL.revokeObjectURL(c.url)), [clips]);

  const processing = status === "running";

  function resetResults() {
    setClips([]);
    setStatus("idle");
    setProgress(null);
  }

  function pickFile(file?: File) {
    if (!file || processing) return;
    const err = validateFile(file);
    if (err) return setError(err);
    setError(null);
    setUrl("");
    resetResults();
    const preview = URL.createObjectURL(file);
    setSource({ kind: "file", file, preview });
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () =>
      setSource((s) => (s?.kind === "file" && s.file === file ? { ...s, duration: v.duration } : s));
    v.src = preview;
  }

  function clear() {
    if (processing) return;
    if (source?.kind === "file") URL.revokeObjectURL(source.preview);
    setSource(null);
    resetResults();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function start() {
    if (running.current) return;
    let file: File;
    if (source?.kind === "file") file = source.file;
    else {
      if (!url.trim()) return setError("Choose a video file or paste a direct video link.");
      const err = validateUrl(url);
      if (err) return setError(err);
      running.current = true;
      setStatus("running");
      setError(null);
      setProgress({ stage: "upload", percent: 1, message: "Downloading video from link…" });
      try {
        const res = await fetch(url.trim());
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const name = new URL(url.trim()).pathname.split("/").pop() || "video.mp4";
        file = new File([blob], name, { type: blob.type || "video/mp4" });
        const fErr = validateFile(file);
        if (fErr) throw new Error(fErr);
      } catch (e) {
        running.current = false;
        setStatus("failed");
        setError((e as Error).message || "We couldn't download that link. The site may block direct downloads — try downloading the file and uploading it instead.");
        return;
      }
    }
    running.current = true;
    setStatus("running");
    setError(null);
    setClips([]);
    setProgress({ stage: "upload", percent: 1, message: "Preparing…" });
    try {
      const { processVideo } = await import("@/lib/hype-processor");
      const result = await processVideo(file, setProgress);
      setClips(result);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("failed");
      setError(
        e instanceof Error && "isHype" in e
          ? e.message
          : "Processing failed. The video may be too large for your browser's memory or use an unsupported codec. Try a shorter MP4.",
      );
    } finally {
      running.current = false;
    }
  }

  async function downloadAll() {
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      clips.forEach((c) => zip.file(c.filename, c.blob));
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "hype-finder-clips.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    } finally {
      setZipping(false);
    }
  }

  const stageIdx = progress ? STAGES.findIndex((s) => s.id === progress.stage) : -1;

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
            <p className="mt-3 text-center text-xs text-muted-foreground">Supports MP4, MOV, WEBM • Max file size: 2 GB (videos are processed on your device; under ~500 MB works best)</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">Only upload videos you own or have permission to edit and publish.</p>
          </div>

          {progress && status !== "idle" && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold">
                    {status === "done" ? "Your clips are ready" : status === "failed" ? "Processing stopped" : "Analyzing your video…"}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">{status === "failed" ? "See the message above." : progress.message}</p>
                </div>
                <span className="shrink-0 font-bold text-primary">{progress.percent}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", status === "failed" ? "bg-muted-foreground" : "bg-gradient-primary")} style={{ width: `${progress.percent}%` }} />
              </div>
              <ol className="mt-5 grid gap-3 sm:grid-cols-5">
                {STAGES.map((s, i) => {
                  const done = status === "done" || i < stageIdx;
                  const active = !done && i === stageIdx;
                  return (
                    <li key={s.id} className="flex items-center gap-2 sm:flex-col sm:items-start">
                      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border", done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary text-primary" : "border-border text-muted-foreground")}>
                        {done ? <Check className="h-4 w-4" /> : active && status === "failed" ? <AlertTriangle className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                      </span>
                      <p className="text-sm font-semibold">{s.title}</p>
                    </li>
                  );
                })}
              </ol>
              {status === "failed" && (
                <button onClick={start} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
                  <RotateCcw className="h-4 w-4" /> Retry
                </button>
              )}
            </div>
          )}

          {status === "done" && clips.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold">Your Top {clips.length} Hype {clips.length === 1 ? "Moment" : "Moments"}</h2>
                  <p className="text-sm text-muted-foreground">Ranked by hype score (audio loudness and sudden energy rises).</p>
                </div>
                <button onClick={downloadAll} disabled={zipping} className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60">
                  {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="hidden sm:inline">Download All ({clips.length})</span><span className="sm:hidden">All</span>
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {clips.map((c, i) => (
                  <div key={c.filename} className="overflow-hidden rounded-xl border border-border bg-elevated">
                    <div className="relative">
                      <video src={c.url} controls playsInline preload="metadata" className="aspect-[9/16] w-full bg-background object-cover" />
                      <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="flex items-center gap-1 font-bold"><Flame className="h-4 w-4 text-primary" />{c.score.toFixed(1)}/10</p>
                      <p className="text-xs text-muted-foreground">{fmtT(c.start)} – {fmtT(c.end)} ({Math.round(c.end - c.start)}s)</p>
                      <a href={c.url} download={c.filename} className="flex items-center justify-center gap-2 rounded-lg bg-gradient-primary py-2 text-sm font-semibold text-primary-foreground">
                        <Download className="h-4 w-4" /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
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
