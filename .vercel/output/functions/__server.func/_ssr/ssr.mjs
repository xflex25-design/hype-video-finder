//#region node_modules/.nitro/vite/services/ssr/index.js
var lastCapturedError;
var TTL_MS = 5e3;
function record(error) {
	lastCapturedError = {
		error,
		at: Date.now()
	};
}
var CAUSE_DEPTH_LIMIT = 5;
var DESCRIPTION_LENGTH_LIMIT = 8e3;
function describeError(error) {
	const parts = [];
	let current = error;
	for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
		if (!(current instanceof Error)) {
			parts.push(typeof current === "string" ? current : safeStringify(current));
			break;
		}
		const label = depth === 0 ? "" : "caused by: ";
		const status = describeStatus(current);
		parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
		current = current.cause;
	}
	return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}
function describeStatus(error) {
	const { status, statusCode } = error;
	const value = status ?? statusCode;
	return typeof value === "number" ? ` (status ${value})` : "";
}
function safeStringify(value) {
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}
function isErrorLike(value) {
	return value instanceof Error;
}
var originalConsoleError = console.error.bind(console);
console.error = (...args) => {
	originalConsoleError(...args.map((arg) => {
		if (!isErrorLike(arg)) return arg;
		record(arg);
		return describeError(arg);
	}));
};
if (typeof globalThis.addEventListener === "function") {
	globalThis.addEventListener("error", (event) => record(event.error ?? event));
	globalThis.addEventListener("unhandledrejection", (event) => record(event.reason));
}
function consumeLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	const { error } = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
function renderErrorPage() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-CYiZVy-g.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!isH3SwallowedErrorBody(body)) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
function isH3SwallowedErrorBody(body) {
	try {
		const payload = JSON.parse(body);
		return payload.unhandled === true && payload.message === "HTTPError";
	} catch {
		return false;
	}
}
var server_default = { async fetch(request, env, ctx) {
	try {
		const url = new URL(request.url);
		if (url.pathname === "/google5381a056419580bb.html") return new Response("google-site-verification: google5381a056419580bb.html", {
			status: 200,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
		if (url.pathname === "/api/youtube-stream") {
			const id = url.searchParams.get("id");
			if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return new Response(JSON.stringify({ error: "Invalid YouTube video ID" }), {
				status: 400,
				headers: { "content-type": "application/json" }
			});
			const streamEndpoints = [
				`https://invidious.nerdvpn.de/api/v1/videos/${id}`,
				`https://inv.tux.pizza/api/v1/videos/${id}`,
				`https://invidious.drgns.space/api/v1/videos/${id}`,
				`https://yt.artemislena.eu/api/v1/videos/${id}`,
				`https://pipedapi.kavin.rocks/streams/${id}`,
				`https://api.piped.privacydev.net/streams/${id}`
			];
			let streamUrl = null;
			let videoTitle = "youtube_video";
			for (const ep of streamEndpoints) try {
				const r = await fetch(ep, {
					headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
					signal: AbortSignal.timeout(3500)
				});
				if (!r.ok) continue;
				const data = await r.json();
				if (data.title) videoTitle = data.title.replace(/[^a-zA-Z0-9_-]/g, "_");
				if (Array.isArray(data.formatStreams) && data.formatStreams.length > 0) {
					const mp4s = data.formatStreams.filter((f) => f.container === "mp4" || f.type?.includes("mp4") || f.url);
					if (mp4s.length > 0) {
						const chosen = mp4s.find((f) => f.qualityLabel === "360p" || f.quality === "medium") || mp4s[0];
						if (chosen?.url) {
							streamUrl = chosen.url;
							break;
						}
					}
				}
				if (Array.isArray(data.videoStreams) && data.videoStreams.length > 0) {
					const mp4s = data.videoStreams.filter((f) => f.format === "mp4" || f.mimeType?.includes("mp4"));
					if (mp4s.length > 0) {
						const chosen = mp4s.find((f) => f.quality === "360p" || f.quality === "720p") || mp4s[0];
						if (chosen?.url) {
							streamUrl = chosen.url;
							break;
						}
					}
				}
			} catch {}
			const download = url.searchParams.get("download") === "true";
			if (streamUrl) {
				if (download) try {
					const mediaRes = await fetch(streamUrl, { headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
						"Referer": "https://www.youtube.com/"
					} });
					if (mediaRes.ok && mediaRes.body) return new Response(mediaRes.body, {
						status: 200,
						headers: {
							"content-type": mediaRes.headers.get("content-type") || "video/mp4",
							"content-disposition": `attachment; filename="${videoTitle}.mp4"`,
							"cache-control": "no-cache"
						}
					});
					else console.warn(`Direct stream proxy failed with status: ${mediaRes.status}`);
				} catch (streamErr) {
					console.warn("Direct stream proxy failed, returning streamUrl instead", streamErr);
				}
				return new Response(JSON.stringify({
					ok: true,
					streamUrl,
					title: videoTitle,
					id
				}), {
					status: 200,
					headers: { "content-type": "application/json" }
				});
			}
			return new Response(JSON.stringify({
				ok: false,
				error: "YouTube's bot protection currently restricts direct automated extraction from this IP. To clip this video right away, download the video or paste a direct video link.",
				id
			}), {
				status: 503,
				headers: { "content-type": "application/json" }
			});
		}
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, renderErrorPage as t };
