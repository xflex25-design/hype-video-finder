import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { t as AppShell } from "./AppShell-D8nzIfG_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-Dgb5jqlF.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/help.tsx?tsr-split=component";
var faqs = [
	{
		q: "Which formats are supported?",
		a: "MP4, MOV and WEBM files up to 2 GB."
	},
	{
		q: "Can I paste a YouTube link?",
		a: "YouTube links and video IDs show a thumbnail preview. YouTube downloading is not connected yet; upload a video file you have permission to use to create clips."
	},
	{
		q: "How long are the clips?",
		a: "Clips are 15–45 seconds, vertical 9:16, ready for Shorts, Reels and TikTok."
	},
	{
		q: "What videos can I upload?",
		a: "Only videos you own or have permission to edit and publish."
	}
];
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
	className: "mx-auto max-w-3xl",
	children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
		className: "font-display text-3xl font-extrabold tracking-tight",
		children: "Help"
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 17,
		columnNumber: 9
	}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mt-8 space-y-3",
		children: faqs.map((f) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("details", {
			className: "group rounded-2xl border border-border bg-card p-5",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("summary", {
				className: "cursor-pointer font-semibold marker:text-primary",
				children: f.q
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 20,
				columnNumber: 15
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: f.a
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 21,
				columnNumber: 15
			}, void 0)]
		}, f.q, true, {
			fileName: _jsxFileName,
			lineNumber: 19,
			columnNumber: 26
		}, void 0))
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 18,
		columnNumber: 9
	}, void 0)]
}, void 0, true, {
	fileName: _jsxFileName,
	lineNumber: 16,
	columnNumber: 7
}, void 0) }, void 0, false, {
	fileName: _jsxFileName,
	lineNumber: 15,
	columnNumber: 30
}, void 0);
//#endregion
export { SplitComponent as component };
