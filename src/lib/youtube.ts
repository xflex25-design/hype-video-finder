export const INVALID_YOUTUBE_URL = "Invalid YouTube URL. Paste full link like https://youtube.com/watch?v=xxxxx";
export const BLOCKED_YOUTUBE_VIDEO = "This video is blocked - try another video (some music videos are blocked)";

export function extractYouTubeId(raw: string): string | null {
  const clean = raw.replace(/\s/g, "");
  if (/^[A-Za-z0-9_-]{11}$/.test(clean)) return clean;
  let url: URL;
  try { url = new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`); }
  catch { return null; }
  if (!/^https?:$/.test(url.protocol) || !/^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)$/i.test(url.hostname)) return null;
  const match = clean.match(/(?:youtube\.com\/(?:.*v=|.*\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/);
  const id = url.searchParams.get("v") || match?.[1];
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function isYouTubeInput(raw: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(raw) || !/[.:/]/.test(raw.trim());
}