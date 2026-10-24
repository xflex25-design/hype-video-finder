import { i as __toESM } from "../_runtime.mjs";
import { r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { i as getUserClips, r as deleteUserClip, s as useAuth } from "./AuthContext-BfNoi7qp.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Trash2, l as Scissors, o as Sparkles, w as Clock, x as ExternalLink } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-D8nzIfG_.mjs";
import { t as ViralScoreCard } from "./ViralScoreCard-D5Nsz8n9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/my-clips-b_j_Jtn_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/my-clips.tsx?tsr-split=component";
function MyClipsPage() {
	const { user, openAuthModal } = useAuth();
	const [clips, setClips] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [activeClip, setActiveClip] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
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
	async function handleDelete(id) {
		if (!confirm("Are you sure you want to delete this clip?")) return;
		if (await deleteUserClip(id)) {
			setClips((prev) => prev.filter((c) => c.id !== id));
			if (activeClip?.id === id) setActiveClip(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mx-auto max-w-5xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex flex-col justify-between gap-4 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
					className: "font-display text-3xl font-extrabold tracking-tight",
					children: "My Clips"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 42,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Your library of saved viral shorts and moments."
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 43,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 41,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/",
					className: "inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-glow transition hover:brightness-110",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Scissors, { className: "h-4 w-4" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 48,
						columnNumber: 13
					}, this), "Find New Hype"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 47,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 40,
				columnNumber: 9
			}, this),
			!user && /* @__PURE__ */ (void 0)("div", {
				className: "mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4",
				children: [/* @__PURE__ */ (void 0)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (void 0)(Sparkles, { className: "h-5 w-5 text-primary shrink-0" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 55,
						columnNumber: 15
					}, this), /* @__PURE__ */ (void 0)("div", { children: [/* @__PURE__ */ (void 0)("p", {
						className: "text-sm font-semibold text-foreground",
						children: "Save your clips permanently"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 57,
						columnNumber: 17
					}, this), /* @__PURE__ */ (void 0)("p", {
						className: "text-xs text-muted-foreground",
						children: "Sign in or create a free account to sync clips to your cloud library."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 58,
						columnNumber: 17
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 56,
						columnNumber: 15
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 54,
					columnNumber: 13
				}, this), /* @__PURE__ */ (void 0)("button", {
					onClick: openAuthModal,
					className: "shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110",
					children: "Sign in"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 63,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 53,
				columnNumber: 19
			}, this),
			loading ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mt-12 text-center text-sm text-muted-foreground",
				children: "Loading your clips..."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 20
			}, this) : clips.length === 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Scissors, { className: "h-10 w-10 text-primary" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 69,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "mt-4 font-semibold text-foreground",
						children: "No clips yet"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 70,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Paste a YouTube link or upload a video file to generate your first viral moments."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 71,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
						to: "/",
						className: "mt-6 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow",
						children: "Start Clipping"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 74,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 68,
				columnNumber: 136
			}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: clips.map((clip) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "grid md:grid-cols-[300px_1fr] gap-6 overflow-hidden rounded-2xl border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "relative",
						children: [clip.video_url ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("video", {
							src: clip.video_url,
							className: "aspect-[9/16] w-full rounded-xl bg-background object-cover",
							controls: true
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 80,
							columnNumber: 37
						}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "aspect-[9/16] w-full rounded-xl grid place-items-center bg-gradient-to-br from-primary/10 to-card",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Sparkles, { className: "h-8 w-8 text-primary" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 81,
								columnNumber: 23
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 80,
							columnNumber: 150
						}, this), clip.viralScore && /* @__PURE__ */ (void 0)("div", {
							className: "absolute top-3 right-3 w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg",
							style: { backgroundColor: clip.viralScore.score >= 80 ? "#E53935" : clip.viralScore.score >= 50 ? "#FB8C00" : "#757575" },
							children: [clip.viralScore.score, "/100"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 83,
							columnNumber: 39
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 79,
						columnNumber: 17
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex flex-1 flex-col justify-between p-2",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
										className: "text-lg font-bold",
										children: clip.title
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 93,
										columnNumber: 23
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										onClick: () => handleDelete(clip.id),
										title: "Delete clip",
										className: "rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive",
										children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Trash2, { className: "h-4 w-4" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 95,
											columnNumber: 25
										}, this)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 94,
										columnNumber: 23
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 92,
									columnNumber: 21
								}, this),
								clip.viralScore && /* @__PURE__ */ (void 0)(ViralScoreCard, {
									score: clip.viralScore.score,
									label: clip.viralScore.label,
									reasons: clip.viralScore.reasons
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 98,
									columnNumber: 41
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-4 text-xs text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
											className: "flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Clock, { className: "h-3.5 w-3.5" }, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 100,
													columnNumber: 64
												}, this),
												" ",
												Math.round(clip.duration),
												"s"
											]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 100,
											columnNumber: 23
										}, this),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: new Date(clip.created_at).toLocaleDateString() }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 101,
											columnNumber: 23
										}, this),
										clip.source_url && /* @__PURE__ */ (void 0)("a", {
											href: clip.source_url,
											target: "_blank",
											rel: "noreferrer",
											className: "inline-flex items-center gap-1 hover:text-foreground",
											children: [/* @__PURE__ */ (void 0)(ExternalLink, { className: "h-3.5 w-3.5" }, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 103,
												columnNumber: 27
											}, this), " Original Source"]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 102,
											columnNumber: 43
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 99,
									columnNumber: 21
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 91,
							columnNumber: 19
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 90,
						columnNumber: 17
					}, this)]
				}, clip.id, true, {
					fileName: _jsxFileName,
					lineNumber: 78,
					columnNumber: 32
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 77,
				columnNumber: 20
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 39,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 38,
		columnNumber: 10
	}, this);
}
//#endregion
export { MyClipsPage as component };
