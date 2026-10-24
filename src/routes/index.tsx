import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Zap, CloudUpload, Link2, FileVideo, X, Sparkles, Shield, Check, Loader2,
  Download, RotateCcw, AlertTriangle, Play, Wand2, Layers, HelpCircle,
  Plus, Scissors, Film, Sliders, ArrowRight, Video, Globe, Users, Clock,
} from "lucide-react";
import type { Progress, ResultClip, Stage } from "@/lib/hype-processor";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { validateFile, validateUrl, formatBytes, formatDuration } from "@/lib/upload";
import { extractYouTubeId, isYouTubeInput, INVALID_YOUTUBE_URL } from "@/lib/youtube";
import { ViralScoreCard } from "@/components/ViralScoreCard";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserClip, deductUserCredits } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INSAKA — Turn Long Videos into Viral Shorts & Reels" },
      { name: "description", content: "INSAKA uses AI to help you create, edit and share amazing viral videos in seconds." },
      { property: "og:title", content: "INSAKA — AI Video Creation Platform" },
      { property: "og:description", content: "Create, edit and share viral videos with AI." },
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
  const { user, credits, openAuthModal, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [clips, setClips] = useState<ResultClip[]>([]);
  const [zipping, setZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "edit" | "effects" | "export">("edit");
  const running = useRef(false);

  useEffect(() => () => clips.forEach((c) => URL.revokeObjectURL(c.url)), [clips]);

  const processing = status === "running";
  const youtubeId = extractYouTubeId(url);

  function scrollToStudio() {
    studioRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function updateUrl(value: string) {
    setUrl(value);
    const id = extractYouTubeId(value);
    setError(value.trim() && isYouTubeInput(value) && !id ? INVALID_YOUTUBE_URL : null);
  }

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

  async function loadDemoVideo() {
    if (processing) return;
    setError(null);
    resetResults();
    scrollToStudio();
    try {
      const res = await fetch("/demo-video.mp4");
      if (!res.ok) throw new Error("Could not load sample video");
      const blob = await res.blob();
      const demoFile = new File([blob], "iShowSpeed_MrBeast_Secrets.mp4", { type: "video/mp4" });
      pickFile(demoFile);
    } catch {
      setError("Could not load sample video. Try uploading a file directly.");
    }
  }

  async function start() {
    if (running.current) return;

    if (user && credits < 5) {
      setError("You need at least 5 credits to clip a video. You have 0 credits remaining.");
      return;
    }

    let file: File;
    if (source?.kind === "file") file = source.file;
    else {
      if (!url.trim()) {
        scrollToStudio();
        return setError("Choose a video file or paste a direct video link.");
      }
      const err = validateUrl(url);
      if (err) return setError(err);

      const ytId = extractYouTubeId(url);
      if (ytId) {
        running.current = true;
        setStatus("running");
        setError(null);
        setProgress({ stage: "upload", percent: 5, message: "Resolving YouTube video stream…" });

        try {
          const res = await fetch(`/api/youtube-stream?id=${ytId}&download=true`);
          if (res.ok && (res.headers.get("content-type")?.includes("video") || res.headers.get("content-disposition"))) {
            const blob = await res.blob();
            file = new File([blob], `${ytId}.mp4`, { type: "video/mp4" });
          } else {
            const data = await res.json().catch(() => null);
            if (data?.streamUrl) {
              setProgress({ stage: "upload", percent: 25, message: "Downloading video from YouTube…" });
              const streamRes = await fetch(data.streamUrl);
              if (!streamRes.ok) throw new Error("Could not download YouTube stream");
              const blob = await streamRes.blob();
              file = new File([blob], `${data.title || ytId}.mp4`, { type: "video/mp4" });
            } else {
              throw new Error(
                data?.error ||
                  "YouTube bot protection currently restricts direct automated extraction from this IP. Download the video or paste a direct video link."
              );
            }
          }
        } catch (ytErr) {
          running.current = false;
          setStatus("failed");
          setError(
            ytErr instanceof Error
              ? ytErr.message
              : "We couldn't download that YouTube link directly. Try uploading the MP4 file instead."
          );
          return;
        }
      } else {
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
          setError((e as Error).message || "We couldn't download that link. Try uploading the file directly.");
          return;
        }
      }
    }

    running.current = true;
    setStatus("running");
    setError(null);
    setClips([]);
    setProgress({ stage: "upload", percent: 1, message: "Preparing video analysis…" });
    try {
      const { processVideo } = await import("@/lib/hype-processor");
      const result = await processVideo(file, setProgress);
      setClips(result);
      setStatus("done");

      if (user) {
        await deductUserCredits(user.id, 5);
        await refreshProfile();
        for (let i = 0; i < result.length; i++) {
          const clip = result[i];
          await saveUserClip({
            user_id: user.id,
            title: `Clip #${i + 1}: ${file.name.replace(/\.[^/.]+$/, "")}`,
            source_url: url.startsWith("http") ? url : undefined,
            duration: clip.end - clip.start,
            hype_score: clip.score,
            clip_data: { start: clip.start, end: clip.end, reason: clip.reason },
          });
        }
      }
    } catch (e) {
      console.error(e);
      setStatus("failed");
      setError(
        e instanceof Error && "isHype" in e
          ? e.message
          : "Processing failed. The video may be too large for browser memory. Try a shorter MP4.",
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
      a.download = "insaka-viral-clips.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    } finally {
      setZipping(false);
    }
  }

  const stageIdx = progress ? STAGES.findIndex((s) => s.id === progress.stage) : -1;

  return (
    <AppShell>
      <div className="relative min-h-screen w-full bg-[#030303] text-white overflow-hidden pb-24">
        {/* Glow ambient background effects */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-red-600/20 via-rose-600/5 to-transparent blur-[120px] rounded-full" />

        {/* HERO SECTION */}
        <section className="relative z-10 pt-12 pb-8 text-center px-4 max-w-4xl mx-auto space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/30 px-4 py-1.5 text-xs font-semibold text-red-400 backdrop-blur">
            <Zap className="h-3.5 w-3.5 fill-red-500 text-red-500" />
            <span>AI Video Creation Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] font-display">
            Turn your ideas into{" "}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-red-600">
              viral videos
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal">
            INSAKA uses AI to help you create, edit and share amazing videos — in seconds.
          </p>

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              onClick={scrollToStudio}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-sm sm:text-base font-bold text-white shadow-[0_0_35px_rgba(229,57,53,0.5)] transition hover:scale-105 hover:brightness-110 active:scale-95"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* INTERACTIVE STUDIO / MOCKUP SECTION */}
        <section ref={studioRef} className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-16">
          {/* Decorative Red Sparkles */}
          <div className="absolute -left-6 top-1/3 text-red-500/60 animate-pulse hidden sm:block">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="absolute -right-6 top-10 text-red-500/80 animate-bounce hidden sm:block">
            <Sparkles className="h-6 w-6" />
          </div>

          {/* Main App Frame Mockup */}
          <div className="relative rounded-3xl border border-white/10 bg-[#0A0A0C]/90 p-3 sm:p-5 shadow-[0_0_80px_rgba(229,57,53,0.15)] backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_200px] gap-4 items-stretch">
              
              {/* Left Toolbar inside mockup */}
              <div className="hidden md:flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-[#121216] p-3 text-xs">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md hover:scale-105 transition"
                  title="Upload Video"
                >
                  <Plus className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setActiveTab("generate")}
                  className={cn("flex flex-col items-center gap-1 text-[10px] font-medium p-2 rounded-xl w-full transition", activeTab === "generate" ? "bg-red-500/10 text-red-400" : "text-muted-foreground hover:text-white")}
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Generate</span>
                </button>

                <button
                  onClick={() => setActiveTab("edit")}
                  className={cn("flex flex-col items-center gap-1 text-[10px] font-medium p-2 rounded-xl w-full transition", activeTab === "edit" ? "bg-red-500/10 text-red-400" : "text-muted-foreground hover:text-white")}
                >
                  <Scissors className="h-4 w-4" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setActiveTab("effects")}
                  className={cn("flex flex-col items-center gap-1 text-[10px] font-medium p-2 rounded-xl w-full transition", activeTab === "effects" ? "bg-red-500/10 text-red-400" : "text-muted-foreground hover:text-white")}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Effects</span>
                </button>

                <button
                  onClick={() => setActiveTab("export")}
                  className={cn("flex flex-col items-center gap-1 text-[10px] font-medium p-2 rounded-xl w-full transition", activeTab === "export" ? "bg-red-500/10 text-red-400" : "text-muted-foreground hover:text-white")}
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>

              {/* Center Video Area */}
              <div className="flex flex-col gap-3 min-w-0">
                {/* Video Container */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black group">
                  {source?.kind === "file" ? (
                    <video
                      src={source.preview}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="relative h-full w-full flex items-center justify-center">
                      <video
                        src="/demo-video.mp4"
                        controls
                        playsInline
                        poster="/assets/aistudio/Screenshot_20261024-150704_Chrome_a124f630.jpg"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Video Controls & Input Bar */}
                <div className="rounded-2xl border border-white/5 bg-[#121216] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                      >
                        <CloudUpload className="h-4 w-4 text-red-400" />
                        <span>Upload MP4 / MOV</span>
                      </button>

                      <button
                        onClick={loadDemoVideo}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Try Sample Video</span>
                      </button>
                    </div>

                    <input
                      ref={inputRef}
                      type="file"
                      accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />

                    <button
                      onClick={start}
                      disabled={processing}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(229,57,53,0.4)] transition hover:brightness-110 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                      <span>{processing ? "Analyzing Video…" : "Clip Video With AI"}</span>
                    </button>
                  </div>

                  {/* URL Input */}
                  {source?.kind !== "file" && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 focus-within:border-red-500/50">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        value={url}
                        disabled={processing}
                        onChange={(e) => updateUrl(e.target.value)}
                        placeholder="Paste YouTube or direct video URL"
                        className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground text-white"
                      />
                    </div>
                  )}

                  {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
                </div>
              </div>

              {/* Right Sidebar inside mockup */}
              <div className="hidden md:flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#121216] p-4 text-xs justify-center">
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 hover:border-red-500/30 transition">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-400">
                    <Wand2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">AI Script</p>
                    <p className="text-[10px] text-muted-foreground">Auto hook generator</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 hover:border-red-500/30 transition">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-400">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">Auto Edit</p>
                    <p className="text-[10px] text-muted-foreground">Silence & filler cut</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 hover:border-red-500/30 transition">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">Smart Effects</p>
                    <p className="text-[10px] text-muted-foreground">Animated captions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 hover:border-red-500/30 transition">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-400">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">HD Export</p>
                    <p className="text-[10px] text-muted-foreground">1080p 60fps 9:16</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Processing Progress Overlay */}
            {progress && status !== "idle" && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-black/90 p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white text-sm">
                      {status === "done" ? "Clips generated successfully!" : status === "failed" ? "Processing error" : "Analyzing video with AI..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{progress.message}</p>
                  </div>
                  <span className="font-bold text-red-500 text-sm">{progress.percent}%</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            )}

            {/* Generated Clips Grid */}
            {status === "done" && clips.length > 0 && (
              <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#0F0F12] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">Generated Viral Clips ({clips.length})</h3>
                  <button
                    onClick={downloadAll}
                    disabled={zipping}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-red-500 transition"
                  >
                    {zipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    <span>Download All Zip</span>
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {clips.map((c, i) => (
                    <div key={c.url} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/60 p-3">
                      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg bg-black">
                        <video src={c.url} controls playsInline className="h-full w-full object-cover" />
                        <div className="absolute top-2 right-2 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow">
                          {c.viralScore.score}/100
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-xs text-white">Clip #{i + 1} ({Math.round(c.end - c.start)}s)</p>
                        <a
                          href={c.url}
                          download={c.filename}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                        >
                          <Download className="h-3.5 w-3.5" /> Download MP4
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* SECTION 2: "Why INSAKA?" */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center space-y-12">
          {/* Section Header */}
          <div className="space-y-3">
            <span className="inline-block rounded-full border border-red-500/30 bg-red-950/20 px-4 py-1 text-xs font-bold text-red-400">
              Why INSAKA?
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
              Everything you need to<br />create viral content.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Powerful AI tools, simple workflow, and everything creators need — all in one place.
            </p>
          </div>

          {/* 2x2 Feature Grid */}
          <div className="grid gap-6 sm:grid-cols-2 text-left">
            {/* Card 1 */}
            <div className="rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 space-y-3 hover:border-red-500/40 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-[0_0_15px_rgba(229,57,53,0.5)]">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Video Generation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Turn text or ideas into stunning videos with just a few clicks.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 space-y-3 hover:border-red-500/40 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-[0_0_15px_rgba(229,57,53,0.5)]">
                <Wand2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Editing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Auto-edit, add captions, music and effects with AI.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 space-y-3 hover:border-red-500/40 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-[0_0_15px_rgba(229,57,53,0.5)]">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Multiple Formats</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create videos for TikTok, YouTube, Instagram and more.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 space-y-3 hover:border-red-500/40 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white shadow-[0_0_15px_rgba(229,57,53,0.5)]">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Secure & Reliable</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your data is safe with enterprise-grade security.
              </p>
            </div>
          </div>

          {/* METRICS BANNER */}
          <div className="rounded-2xl border border-red-500/30 bg-[#0A0A0C] p-6 sm:p-8 shadow-[0_0_50px_rgba(229,57,53,0.1)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="pt-2 md:pt-0">
                <p className="text-3xl sm:text-4xl font-extrabold text-red-500 font-display">95K+</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Active Creators</p>
              </div>
              <div className="pt-4 md:pt-0">
                <p className="text-3xl sm:text-4xl font-extrabold text-white font-display">1M+</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Videos Created</p>
              </div>
              <div className="pt-4 md:pt-0">
                <p className="text-3xl sm:text-4xl font-extrabold text-red-500 font-display">99%</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Uptime</p>
              </div>
              <div className="pt-4 md:pt-0">
                <p className="text-3xl sm:text-4xl font-extrabold text-white font-display">150+</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Countries</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: "Simple Pricing" */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center space-y-12">
          {/* Header */}
          <div className="space-y-3">
            <span className="inline-block rounded-full border border-red-500/30 bg-red-950/20 px-4 py-1 text-xs font-bold text-red-400">
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
              Choose the plan<br />that fits your goals.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Start free and upgrade anytime. No hidden fees.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid gap-8 md:grid-cols-2 text-left max-w-3xl mx-auto items-stretch">
            {/* Card 1: Creator */}
            <div className="relative rounded-3xl border-2 border-red-600 bg-[#0C0C0F] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-[0_0_40px_rgba(229,57,53,0.2)]">
              {/* Badge */}
              <div className="absolute -top-3.5 left-6 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow">
                Most Popular
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="text-2xl font-bold text-white">Creator</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white font-display">$49.99</span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Billed monthly.</p>
                  <p className="text-xs font-bold text-red-400 mt-1">300 AI credits / month</p>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground pt-2">
                  <li className="flex items-center gap-2.5 text-white font-medium">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>300 AI credits per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>Studio editor with AI edit</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>1080p video export</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>4 social platforms (1 account each)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>AI clipping</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={openAuthModal}
                className="w-full rounded-full bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Choose Creator →
              </button>
            </div>

            {/* Card 2: Pro */}
            <div className="rounded-3xl border border-white/10 bg-[#0C0C0F] p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-red-500/30 transition">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">Pro</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white font-display">$99.99</span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Billed monthly.</p>
                  <p className="text-xs font-bold text-red-400 mt-1">800 AI credits / month</p>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground pt-2">
                  <li className="flex items-center gap-2.5 text-white font-medium">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>800 AI credits per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>Studio editor with AI edit</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>1080p video export</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>All 5 social platforms (1 account each)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>AI clipping</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>Up to 5 automations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-red-500 shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={openAuthModal}
                className="w-full rounded-full bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Choose Pro →
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: "Get Started" Workflow Steps */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center space-y-12">
          <div className="space-y-3">
            <span className="inline-block rounded-full border border-red-500/30 bg-red-950/20 px-4 py-1 text-xs font-bold text-red-400">
              Get Started
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
              Simple steps to<br />create your first video.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              No technical skills needed. Just your ideas and INSAKA.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 text-center items-center">
            {/* Step 1 */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs font-bold text-white">
                  1
                </span>
                <div className="grid h-14 w-14 place-items-center rounded-full border border-red-500/30 bg-red-950/30 text-red-400">
                  <Scissors className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Describe Your Idea</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                "Type a prompt or upload your media."
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs font-bold text-white">
                  2
                </span>
                <div className="grid h-14 w-14 place-items-center rounded-full border border-red-500/30 bg-red-950/30 text-red-400">
                  <Wand2 className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Let AI Do The Work</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                "INSAKA creates and edits your video automatically."
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs font-bold text-white">
                  3
                </span>
                <div className="grid h-14 w-14 place-items-center rounded-full border border-red-500/30 bg-red-950/30 text-red-400">
                  <Download className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Download & Share</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                "Get your video in high quality and post it anywhere."
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: FAQ Quick Bar */}
        <section className="relative z-10 max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="flex items-center gap-4 text-left">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-600 text-white font-bold text-xl shadow-md">
                ?
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Need Help?</p>
                <h3 className="text-base sm:text-lg font-bold text-white">Frequently asked questions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Find answers to common questions about INSAKA.</p>
              </div>
            </div>

            <Link
              to="/help"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-6 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
            >
              <span>View All FAQs →</span>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10 border-t border-white/10 pt-16 pb-8 px-4 max-w-6xl mx-auto mt-16 text-xs text-muted-foreground">
          <div className="grid gap-10 md:grid-cols-4 mb-12">
            {/* Brand Logo & Social Icons */}
            <div className="space-y-4 md:col-span-1">
              <Link to="/" aria-label="Insaka home">
                <img src="/logo.png" alt="Insaka" className="h-8 w-auto object-contain" />
              </Link>
              <div className="flex items-center gap-3 pt-2">
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Video className="h-4 w-4" />
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Film className="h-4 w-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  <Users className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-2">
              <p className="font-bold text-white text-xs uppercase tracking-wider">Product</p>
              <ul className="space-y-1.5">
                <li><a href="#features" onClick={scrollToStudio} className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" onClick={scrollToStudio} className="hover:text-white transition">Pricing</a></li>
                <li><a href="#templates" onClick={scrollToStudio} className="hover:text-white transition">Templates</a></li>
                <li><a href="#blog" onClick={scrollToStudio} className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-2">
              <p className="font-bold text-white text-xs uppercase tracking-wider">Company</p>
              <ul className="space-y-1.5">
                <li><Link to="/help" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/help" className="hover:text-white transition">Careers</Link></li>
                <li><Link to="/help" className="hover:text-white transition">Contact</Link></li>
                <li><Link to="/help" className="hover:text-white transition">Privacy</Link></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="space-y-2">
              <p className="font-bold text-white text-xs uppercase tracking-wider">Support</p>
              <ul className="space-y-1.5">
                <li><Link to="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link to="/help" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link to="/help" className="hover:text-white transition">Privacy policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="text-center border-t border-white/5 pt-6">
            <p>© 2026 INSAKA. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
