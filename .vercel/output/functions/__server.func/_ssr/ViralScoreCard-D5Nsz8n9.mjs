import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ViralScoreCard-D5Nsz8n9.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/components/ViralScoreCard.tsx";
function ViralScoreCard({ score, label, reasons }) {
	const getBackgroundColor = (s) => {
		if (s >= 80) return "#E53935";
		if (s >= 50) return "#FB8C00";
		return "#757575";
	};
	const color = getBackgroundColor(score);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "p-4 border border-border rounded-xl bg-card",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "flex items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
				style: { backgroundColor: color },
				children: [score, "/100"]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 11,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "font-bold text-base",
				children: label
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 15,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 14,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 10,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("ul", {
			className: "mt-3 space-y-1.5 text-xs text-muted-foreground list-disc pl-4",
			children: reasons.map((r, i) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: r }, i, false, {
				fileName: _jsxFileName,
				lineNumber: 19,
				columnNumber: 32
			}, this))
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 18,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 9,
		columnNumber: 5
	}, this);
}
//#endregion
export { ViralScoreCard as t };
