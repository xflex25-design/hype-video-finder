import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/google5381a056419580bb.html") {
        return new Response("google-site-verification: google5381a056419580bb.html", {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        });
      }

      // YouTube stream resolver endpoint
      if (url.pathname === "/api/youtube-stream") {
        const id = url.searchParams.get("id");
        if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
          return new Response(JSON.stringify({ error: "Invalid YouTube video ID" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Try multiple public Invidious / Piped / stream instances
        const streamEndpoints = [
          `https://invidious.nerdvpn.de/api/v1/videos/${id}`,
          `https://inv.tux.pizza/api/v1/videos/${id}`,
          `https://invidious.drgns.space/api/v1/videos/${id}`,
          `https://yt.artemislena.eu/api/v1/videos/${id}`,
          `https://pipedapi.kavin.rocks/streams/${id}`,
          `https://api.piped.privacydev.net/streams/${id}`,
        ];

        let streamUrl: string | null = null;
        let videoTitle = "youtube_video";

        for (const ep of streamEndpoints) {
          try {
            const r = await fetch(ep, {
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
              signal: AbortSignal.timeout(3500),
            });
            if (!r.ok) continue;
            const data = (await r.json()) as any;
            if (data.title) videoTitle = data.title.replace(/[^a-zA-Z0-9_-]/g, "_");

            // Invidious formatStreams
            if (Array.isArray(data.formatStreams) && data.formatStreams.length > 0) {
              const mp4s = data.formatStreams.filter(
                (f: any) => f.container === "mp4" || f.type?.includes("mp4") || f.url
              );
              if (mp4s.length > 0) {
                // prefer 360p or 720p for fast processing in ffmpeg.wasm
                const chosen = mp4s.find((f: any) => f.qualityLabel === "360p" || f.quality === "medium") || mp4s[0];
                if (chosen?.url) {
                  streamUrl = chosen.url;
                  break;
                }
              }
            }

            // Piped videoStreams
            if (Array.isArray(data.videoStreams) && data.videoStreams.length > 0) {
              const mp4s = data.videoStreams.filter(
                (f: any) => f.format === "mp4" || f.mimeType?.includes("mp4")
              );
              if (mp4s.length > 0) {
                const chosen = mp4s.find((f: any) => f.quality === "360p" || f.quality === "720p") || mp4s[0];
                if (chosen?.url) {
                  streamUrl = chosen.url;
                  break;
                }
              }
            }
          } catch {
            // try next endpoint
          }
        }

        // Check if client wants metadata or proxied stream
        const download = url.searchParams.get("download") === "true";

        if (streamUrl) {
          if (download) {
            try {
              const mediaRes = await fetch(streamUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                  "Referer": "https://www.youtube.com/"
                },
              });
              
              if (mediaRes.ok && mediaRes.body) {
                return new Response(mediaRes.body, {
                  status: 200,
                  headers: {
                    "content-type": mediaRes.headers.get("content-type") || "video/mp4",
                    "content-disposition": `attachment; filename="${videoTitle}.mp4"`,
                    "cache-control": "no-cache",
                  },
                });
              } else {
                console.warn(`Direct stream proxy failed with status: ${mediaRes.status}`);
                // If proxy fails with 403, don't just return the error, return the URL as a fallback
                // so the browser can try it directly (or show a useful error)
              }
            } catch (streamErr) {
              console.warn("Direct stream proxy failed, returning streamUrl instead", streamErr);
            }
          }

          return new Response(
            JSON.stringify({
              ok: true,
              streamUrl,
              title: videoTitle,
              id,
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          );
        }

        // Fallback: If public instances are rate limited, return detailed guidance
        return new Response(
          JSON.stringify({
            ok: false,
            error:
              "YouTube's bot protection currently restricts direct automated extraction from this IP. To clip this video right away, download the video or paste a direct video link.",
            id,
          }),
          {
            status: 503,
            headers: { "content-type": "application/json" },
          }
        );
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
