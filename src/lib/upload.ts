import { extractYouTubeId, isYouTubeInput, INVALID_YOUTUBE_URL } from "./youtube";

export const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const ALLOWED_EXT = ["mp4", "mov", "webm"];

export function validateFile(file: { name: string; size: number }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) return "Unsupported format. Please use MP4, MOV or WEBM.";
  if (file.size > MAX_FILE_BYTES) return "File is too large. Maximum size is 2 GB.";
  return null;
}

export function validateUrl(raw: string): string | null {
  if (extractYouTubeId(raw)) return null;
  if (isYouTubeInput(raw)) return INVALID_YOUTUBE_URL;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "Please enter a valid link starting with https://";
  }
  if (!/^https?:$/.test(url.protocol)) return "Link must start with http:// or https://";
  const ext = url.pathname.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext))
    return "Link must point directly to a video file ending in .mp4, .mov or .webm.";
  return null;
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(0)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDuration(sec: number) {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}
