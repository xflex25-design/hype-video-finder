import { i as __toESM } from "../_runtime.mjs";
import { r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { n as deductUserCredits, o as saveUserClip, s as useAuth } from "./AuthContext-BfNoi7qp.mjs";
import { C as CloudUpload, D as Check, O as AudioLines, S as Download, _ as Link2, b as FilePlay, c as ShieldCheck, g as LoaderCircle, i as TriangleAlert, n as X, o as Sparkles, s as Smartphone, t as Zap, u as RotateCcw } from "../_libs/lucide-react.mjs";
import { n as cn, t as AppShell } from "./AppShell-D8nzIfG_.mjs";
import { t as ViralScoreCard } from "./ViralScoreCard-D5Nsz8n9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D6150l5n.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var INVALID_YOUTUBE_URL = "Invalid YouTube URL. Paste full link like https://youtube.com/watch?v=xxxxx";
function extractYouTubeId(raw) {
	const clean = raw.replace(/\s/g, "");
	if (/^[A-Za-z0-9_-]{11}$/.test(clean)) return clean;
	let url;
	try {
		url = new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`);
	} catch {
		return null;
	}
	if (!/^https?:$/.test(url.protocol) || !/^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)$/i.test(url.hostname)) return null;
	const match = clean.match(/(?:youtube\.com\/(?:.*v=|.*\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/);
	const id = url.searchParams.get("v") || match?.[1];
	return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
function isYouTubeInput(raw) {
	return /(?:youtube\.com|youtu\.be)/i.test(raw) || !/[.:/]/.test(raw.trim());
}
var ALLOWED_EXT = [
	"mp4",
	"mov",
	"webm"
];
function validateFile(file) {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	if (!ALLOWED_EXT.includes(ext)) return "Unsupported format. Please use MP4, MOV or WEBM.";
	if (file.size > 2147483648) return "File is too large. Maximum size is 2 GB.";
	return null;
}
function validateUrl(raw) {
	if (extractYouTubeId(raw)) return null;
	if (isYouTubeInput(raw)) return INVALID_YOUTUBE_URL;
	let url;
	try {
		url = new URL(raw.trim());
	} catch {
		return "Please enter a valid link starting with https://";
	}
	if (!/^https?:$/.test(url.protocol)) return "Link must start with http:// or https://";
	const ext = url.pathname.split(".").pop()?.toLowerCase() ?? "";
	if (!ALLOWED_EXT.includes(ext)) return "Link must point directly to a video file ending in .mp4, .mov or .webm.";
	return null;
}
function formatBytes(n) {
	if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
	if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(0)} MB`;
	return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
function formatDuration(sec) {
	const s = Math.round(sec);
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const r = String(s % 60).padStart(2, "0");
	return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}
var _jsxFileName = "/app/applet/src/routes/index.tsx?tsr-split=component";
var STAGES = [
	{
		id: "upload",
		title: "Uploading video"
	},
	{
		id: "audio",
		title: "Analyzing audio"
	},
	{
		id: "moments",
		title: "Finding exciting moments"
	},
	{
		id: "clips",
		title: "Creating vertical clips"
	},
	{
		id: "downloads",
		title: "Preparing downloads"
	}
];
var fmtT = (t) => formatDuration(t);
function Index() {
	const { user, credits, openAuthModal, refreshProfile } = useAuth();
	const inputRef = (0, import_react.useRef)(null);
	const [source, setSource] = (0, import_react.useState)(null);
	const [url, setUrl] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [drag, setDrag] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("idle");
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [clips, setClips] = (0, import_react.useState)([]);
	const [zipping, setZipping] = (0, import_react.useState)(false);
	const running = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => () => clips.forEach((c) => URL.revokeObjectURL(c.url)), [clips]);
	const processing = status === "running";
	const youtubeId = extractYouTubeId(url);
	function updateUrl(value) {
		setUrl(value);
		const id = extractYouTubeId(value);
		setError(value.trim() && isYouTubeInput(value) && !id ? INVALID_YOUTUBE_URL : null);
	}
	function resetResults() {
		setClips([]);
		setStatus("idle");
		setProgress(null);
	}
	function pickFile(file) {
		if (!file || processing) return;
		const err = validateFile(file);
		if (err) return setError(err);
		setError(null);
		setUrl("");
		resetResults();
		const preview = URL.createObjectURL(file);
		setSource({
			kind: "file",
			file,
			preview
		});
		const v = document.createElement("video");
		v.preload = "metadata";
		v.onloadedmetadata = () => setSource((s) => s?.kind === "file" && s.file === file ? {
			...s,
			duration: v.duration
		} : s);
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
		if (user && credits < 5) {
			setError("You need at least 5 credits to clip a video. You have 0 credits remaining.");
			return;
		}
		let file;
		if (source?.kind === "file") file = source.file;
		else {
			if (!url.trim()) return setError("Choose a video file or paste a direct video link.");
			const err = validateUrl(url);
			if (err) return setError(err);
			const ytId = extractYouTubeId(url);
			if (ytId) {
				running.current = true;
				setStatus("running");
				setError(null);
				setProgress({
					stage: "upload",
					percent: 5,
					message: "Resolving YouTube video stream…"
				});
				try {
					const res = await fetch(`/api/youtube-stream?id=${ytId}&download=true`);
					if (res.ok && (res.headers.get("content-type")?.includes("video") || res.headers.get("content-disposition"))) {
						const blob = await res.blob();
						file = new File([blob], `${ytId}.mp4`, { type: "video/mp4" });
					} else {
						const data = await res.json().catch(() => null);
						if (data?.streamUrl) {
							setProgress({
								stage: "upload",
								percent: 25,
								message: "Downloading video from YouTube…"
							});
							const streamRes = await fetch(data.streamUrl);
							if (!streamRes.ok) throw new Error("Could not download YouTube stream");
							const blob = await streamRes.blob();
							file = new File([blob], `${data.title || ytId}.mp4`, { type: "video/mp4" });
						} else throw new Error(data?.error || "YouTube bot protection currently restricts direct automated extraction from this IP. To clip this video right away, download the video or paste a direct video link.");
					}
				} catch (ytErr) {
					running.current = false;
					setStatus("failed");
					setError(ytErr instanceof Error ? ytErr.message : "We couldn't download that YouTube link directly. The site may block automated downloads — try uploading the MP4 file instead.");
					return;
				}
			} else {
				running.current = true;
				setStatus("running");
				setError(null);
				setProgress({
					stage: "upload",
					percent: 1,
					message: "Downloading video from link…"
				});
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
					setError(e.message || "We couldn't download that link. The site may block direct downloads — try downloading the file and uploading it instead.");
					return;
				}
			}
		}
		running.current = true;
		setStatus("running");
		setError(null);
		setClips([]);
		setProgress({
			stage: "upload",
			percent: 1,
			message: "Preparing video analysis…"
		});
		try {
			const { processVideo } = await import("./hype-processor-DvtQe7uT.mjs");
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
						source_url: url.startsWith("http") ? url : void 0,
						duration: clip.end - clip.start,
						hype_score: clip.score,
						clip_data: {
							start: clip.start,
							end: clip.end,
							reason: clip.reason
						}
					});
				}
			}
		} catch (e) {
			console.error(e);
			setStatus("failed");
			setError(e instanceof Error && "isHype" in e ? e.message : "Processing failed. The video may be too large for your browser's memory or use an unsupported codec. Try a shorter MP4.");
		} finally {
			running.current = false;
		}
	}
	async function downloadAll() {
		setZipping(true);
		try {
			const JSZip = (await import("../_libs/jszip+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()))).default;
			const zip = new JSZip();
			clips.forEach((c) => zip.file(c.filename, c.blob));
			const blob = await zip.generateAsync({
				type: "blob",
				compression: "STORE"
			});
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = "hype-finder-clips.zip";
			a.click();
			setTimeout(() => URL.revokeObjectURL(a.href), 3e4);
		} finally {
			setZipping(false);
		}
	}
	const stageIdx = progress ? STAGES.findIndex((s) => s.id === progress.stage) : -1;
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_400px]",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", {
			className: "min-w-0 space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Zap, { className: "h-3.5 w-3.5 fill-primary text-primary" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 245,
						columnNumber: 13
					}, this), " AI-Powered Video Clipping"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 244,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
					className: "font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl",
					children: [
						"Turn long videos",
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("br", {}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 250,
							columnNumber: 15
						}, this),
						"into ",
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "text-primary",
							children: "viral moments."
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 251,
							columnNumber: 20
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 248,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-4 max-w-xl text-base text-muted-foreground sm:text-lg",
					children: "Find the most exciting, funny and engaging moments in your videos — automatically."
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 253,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 247,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "rounded-2xl border-2 border-dashed border-primary/50 bg-card p-4 sm:p-6",
					children: [
						source?.kind === "file" ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-4 rounded-xl border border-border bg-elevated p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15",
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FilePlay, { className: "h-6 w-6 text-primary" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 261,
										columnNumber: 19
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 260,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
										className: "truncate font-semibold",
										children: source.file.name
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 264,
										columnNumber: 19
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
										className: "text-sm text-muted-foreground",
										children: [formatBytes(source.file.size), source.duration ? ` • ${formatDuration(source.duration)}` : ""]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 265,
										columnNumber: 19
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 263,
									columnNumber: 17
								}, this),
								!processing && /* @__PURE__ */ (void 0)("div", {
									className: "flex shrink-0 gap-2",
									children: [/* @__PURE__ */ (void 0)("button", {
										onClick: () => inputRef.current?.click(),
										className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent",
										children: "Replace"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 271,
										columnNumber: 21
									}, this), /* @__PURE__ */ (void 0)("button", {
										"aria-label": "Remove video",
										onClick: clear,
										className: "grid h-10 w-10 place-items-center rounded-lg border border-border hover:bg-accent",
										children: /* @__PURE__ */ (void 0)(X, { className: "h-4 w-4" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 275,
											columnNumber: 23
										}, this)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 274,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 270,
									columnNumber: 33
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 259,
							columnNumber: 40
						}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							onClick: () => inputRef.current?.click(),
							onDragOver: (e) => {
								e.preventDefault();
								setDrag(true);
							},
							onDragLeave: () => setDrag(false),
							onDrop: (e) => {
								e.preventDefault();
								setDrag(false);
								pickFile(e.dataTransfer.files[0]);
							},
							className: cn("flex w-full flex-col items-center gap-2 rounded-xl py-10 transition-colors", drag ? "bg-primary/10" : "hover:bg-accent/50"),
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CloudUpload, { className: "h-14 w-14 text-primary" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 286,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-lg font-bold",
									children: "Drop your video file here"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 287,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-sm text-muted-foreground",
									children: "or click to browse"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 288,
									columnNumber: 17
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 278,
							columnNumber: 24
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
							ref: inputRef,
							type: "file",
							accept: ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm",
							className: "hidden",
							onChange: (e) => pickFile(e.target.files?.[0])
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 290,
							columnNumber: 13
						}, this),
						source?.kind !== "file" && /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [
							/* @__PURE__ */ (void 0)("div", {
								className: "my-4 flex items-center gap-3 text-xs font-semibold text-muted-foreground",
								children: [
									/* @__PURE__ */ (void 0)("div", { className: "h-px flex-1 bg-border" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 294,
										columnNumber: 19
									}, this),
									" OR ",
									/* @__PURE__ */ (void 0)("div", { className: "h-px flex-1 bg-border" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 294,
										columnNumber: 64
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 293,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ (void 0)("label", {
								className: "flex items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary",
								children: [/* @__PURE__ */ (void 0)(Link2, { className: "h-4 w-4 shrink-0 text-muted-foreground" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 297,
									columnNumber: 19
								}, this), /* @__PURE__ */ (void 0)("input", {
									value: url,
									disabled: processing,
									"aria-label": "YouTube or direct video link",
									maxLength: 2048,
									onChange: (e) => updateUrl(e.target.value),
									onPaste: (e) => {
										e.preventDefault();
										updateUrl(e.clipboardData.getData("text"));
									},
									placeholder: "Paste YouTube link, video ID or direct video link",
									className: "h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 298,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 296,
								columnNumber: 17
							}, this),
							youtubeId && /* @__PURE__ */ (void 0)("div", {
								className: "mt-3 overflow-hidden rounded-lg border border-border",
								children: /* @__PURE__ */ (void 0)("img", {
									src: `https://img.youtube.com/vi/${youtubeId}/0.jpg`,
									alt: `YouTube video ${youtubeId} thumbnail`,
									className: "aspect-video w-full object-cover"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 304,
									columnNumber: 21
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 303,
								columnNumber: 31
							}, this)
						] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 292,
							columnNumber: 41
						}, this),
						error && /* @__PURE__ */ (void 0)("p", {
							role: "alert",
							className: "mt-3 text-sm text-primary-glow",
							children: error
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 308,
							columnNumber: 23
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							onClick: start,
							disabled: processing,
							className: "mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
							children: [processing ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoaderCircle, { className: "h-5 w-5 animate-spin" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 311,
								columnNumber: 29
							}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Zap, { className: "h-5 w-5 fill-current" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 311,
								columnNumber: 76
							}, this), processing ? "Finding your hype…" : "Find My Hype"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 310,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "mt-3 text-center text-xs text-muted-foreground",
							children: "Supports MP4, MOV, WEBM • Max file size: 2 GB (videos are processed on your device; under ~500 MB works best)"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 314,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "mt-1 text-center text-xs text-muted-foreground",
							children: "Only upload videos you own or have permission to edit and publish."
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 315,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 258,
					columnNumber: 11
				}, this),
				progress && status !== "idle" && /* @__PURE__ */ (void 0)("div", {
					className: "rounded-2xl border border-border bg-card p-5",
					children: [
						/* @__PURE__ */ (void 0)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (void 0)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (void 0)("h2", {
									className: "font-display text-lg font-bold",
									children: status === "done" ? "Your clips are ready" : status === "failed" ? "Processing stopped" : "Analyzing your video…"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 321,
									columnNumber: 19
								}, this), /* @__PURE__ */ (void 0)("p", {
									className: "truncate text-sm text-muted-foreground",
									children: status === "failed" ? "See the message above." : progress.message
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 324,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 320,
								columnNumber: 17
							}, this), /* @__PURE__ */ (void 0)("span", {
								className: "shrink-0 font-bold text-primary",
								children: [progress.percent, "%"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 326,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 319,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (void 0)("div", {
							className: "mt-4 h-2 overflow-hidden rounded-full bg-muted",
							children: /* @__PURE__ */ (void 0)("div", {
								className: cn("h-full rounded-full transition-all", status === "failed" ? "bg-muted-foreground" : "bg-gradient-primary"),
								style: { width: `${progress.percent}%` }
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 329,
								columnNumber: 17
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 328,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (void 0)("ol", {
							className: "mt-5 grid gap-3 sm:grid-cols-5",
							children: STAGES.map((s, i) => {
								const done = status === "done" || i < stageIdx;
								const active = !done && i === stageIdx;
								return /* @__PURE__ */ (void 0)("li", {
									className: "flex items-center gap-2 sm:flex-col sm:items-start",
									children: [/* @__PURE__ */ (void 0)("span", {
										className: cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border", done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary text-primary" : "border-border text-muted-foreground"),
										children: done ? /* @__PURE__ */ (void 0)(Check, { className: "h-4 w-4" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 339,
											columnNumber: 33
										}, this) : active && status === "failed" ? /* @__PURE__ */ (void 0)(TriangleAlert, { className: "h-4 w-4" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 339,
											columnNumber: 97
										}, this) : active ? /* @__PURE__ */ (void 0)(LoaderCircle, { className: "h-4 w-4 animate-spin" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 339,
											columnNumber: 146
										}, this) : /* @__PURE__ */ (void 0)("span", { className: "h-2 w-2 rounded-full bg-current" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 339,
											columnNumber: 193
										}, this)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 338,
										columnNumber: 23
									}, this), /* @__PURE__ */ (void 0)("p", {
										className: "text-sm font-semibold",
										children: s.title
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 341,
										columnNumber: 23
									}, this)]
								}, s.id, true, {
									fileName: _jsxFileName,
									lineNumber: 337,
									columnNumber: 22
								}, this);
							})
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 333,
							columnNumber: 15
						}, this),
						status === "failed" && /* @__PURE__ */ (void 0)("button", {
							onClick: start,
							className: "mt-5 inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10",
							children: [/* @__PURE__ */ (void 0)(RotateCcw, { className: "h-4 w-4" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 346,
								columnNumber: 19
							}, this), " Retry"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 345,
							columnNumber: 39
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 318,
					columnNumber: 45
				}, this),
				status === "done" && clips.length > 0 && /* @__PURE__ */ (void 0)("div", {
					className: "rounded-2xl border border-border bg-card p-5",
					children: [/* @__PURE__ */ (void 0)("div", {
						className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4",
						children: [/* @__PURE__ */ (void 0)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (void 0)("h2", {
								className: "font-display text-xl font-bold",
								children: [
									"Your Top ",
									clips.length,
									" Hype ",
									clips.length === 1 ? "Moment" : "Moments"
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 353,
								columnNumber: 19
							}, this), /* @__PURE__ */ (void 0)("p", {
								className: "text-sm text-muted-foreground",
								children: "Ranked by hype score (audio loudness and sudden energy rises)."
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 354,
								columnNumber: 19
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 352,
							columnNumber: 17
						}, this), /* @__PURE__ */ (void 0)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (void 0)("select", {
								className: "rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none",
								onChange: (e) => setClips([...clips].sort((a, b) => e.target.value === "viral" ? b.viralScore.score - a.viralScore.score : 0)),
								children: [/* @__PURE__ */ (void 0)("option", {
									value: "default",
									children: "Sort by Hype"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 358,
									columnNumber: 21
								}, this), /* @__PURE__ */ (void 0)("option", {
									value: "viral",
									children: "Sort by Viral Score"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 359,
									columnNumber: 21
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 357,
								columnNumber: 19
							}, this), /* @__PURE__ */ (void 0)("button", {
								onClick: downloadAll,
								disabled: zipping,
								className: "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60",
								children: [
									zipping ? /* @__PURE__ */ (void 0)(LoaderCircle, { className: "h-4 w-4 animate-spin" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 362,
										columnNumber: 32
									}, this) : /* @__PURE__ */ (void 0)(Download, { className: "h-4 w-4" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 362,
										columnNumber: 79
									}, this),
									/* @__PURE__ */ (void 0)("span", {
										className: "hidden sm:inline",
										children: [
											"Download All (",
											clips.length,
											")"
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 363,
										columnNumber: 21
									}, this),
									/* @__PURE__ */ (void 0)("span", {
										className: "sm:hidden",
										children: "All"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 363,
										columnNumber: 92
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 361,
								columnNumber: 19
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 356,
							columnNumber: 17
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 351,
						columnNumber: 15
					}, this), /* @__PURE__ */ (void 0)("div", {
						className: "mt-5 grid gap-6",
						children: [...clips].sort((a, b) => b.viralScore.score - a.viralScore.score).map((c, i) => /* @__PURE__ */ (void 0)("div", {
							className: "grid md:grid-cols-[300px_1fr] gap-6 overflow-hidden rounded-2xl border border-border bg-card p-4",
							children: [/* @__PURE__ */ (void 0)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (void 0)("video", {
									src: c.url,
									controls: true,
									playsInline: true,
									preload: "metadata",
									className: "aspect-[9/16] w-full rounded-xl bg-background object-cover"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 370,
									columnNumber: 23
								}, this), /* @__PURE__ */ (void 0)("div", {
									className: "absolute top-3 right-3 w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg",
									style: { backgroundColor: c.viralScore.score >= 80 ? "#E53935" : c.viralScore.score >= 50 ? "#FB8C00" : "#757575" },
									children: [c.viralScore.score, "/100"]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 371,
									columnNumber: 23
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 369,
								columnNumber: 21
							}, this), /* @__PURE__ */ (void 0)("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (void 0)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (void 0)("h3", {
											className: "text-lg font-bold",
											children: ["Moment #", i + 1]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 379,
											columnNumber: 25
										}, this), /* @__PURE__ */ (void 0)("a", {
											href: c.url,
											download: c.filename,
											className: "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
											children: [/* @__PURE__ */ (void 0)(Download, { className: "h-4 w-4" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 381,
												columnNumber: 27
											}, this), " Download Clip"]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 380,
											columnNumber: 25
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 378,
										columnNumber: 23
									}, this),
									/* @__PURE__ */ (void 0)(ViralScoreCard, {
										score: c.viralScore.score,
										label: c.viralScore.label,
										reasons: c.viralScore.reasons
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 384,
										columnNumber: 23
									}, this),
									/* @__PURE__ */ (void 0)("p", {
										className: "text-sm text-muted-foreground",
										children: [
											fmtT(c.start),
											" – ",
											fmtT(c.end),
											" (",
											Math.round(c.end - c.start),
											"s)"
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 385,
										columnNumber: 23
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 377,
								columnNumber: 21
							}, this)]
						}, c.url, true, {
							fileName: _jsxFileName,
							lineNumber: 368,
							columnNumber: 99
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 367,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 350,
					columnNumber: 53
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 243,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("aside", {
			className: "h-fit rounded-2xl border border-border bg-card p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
					className: "font-display text-xl font-bold",
					children: "How It Works"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 394,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("ol", {
					className: "mt-6 space-y-6",
					children: [
						{
							icon: AudioLines,
							t: "We analyze your video",
							d: "Detects loudness spikes, shouting, laughter, crowd noise and more."
						},
						{
							icon: Sparkles,
							t: "Finds the best moments",
							d: "Ranks clips by energy and engagement."
						},
						{
							icon: Smartphone,
							t: "Creates short clips",
							d: "15–45 seconds, vertical 9:16, with captions (when available)."
						}
					].map((s, i) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", {
						className: "flex items-start gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground",
								children: i + 1
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 409,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(s.icon, { className: "h-6 w-6 text-primary" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 411,
									columnNumber: 19
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 410,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "font-semibold",
								children: s.t
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 414,
								columnNumber: 19
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "text-sm text-muted-foreground",
								children: s.d
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 415,
								columnNumber: 19
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 413,
								columnNumber: 17
							}, this)
						]
					}, s.t, true, {
						fileName: _jsxFileName,
						lineNumber: 408,
						columnNumber: 28
					}, this))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 395,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "mt-6 flex items-center gap-3 rounded-xl border border-border p-4 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ShieldCheck, { className: "h-6 w-6 shrink-0 text-primary" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 420,
						columnNumber: 13
					}, this), "Only use videos you own or have permission to clip."]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 419,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 393,
			columnNumber: 9
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 242,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 241,
		columnNumber: 10
	}, this);
}
//#endregion
export { Index as component };
