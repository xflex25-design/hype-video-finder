// Runs FFmpeg (WebAssembly build) in a browser worker. Browser-only: import dynamically.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { findClips, levelsFromPcm, type Clip } from "./hype-engine";

export type Stage = "upload" | "audio" | "moments" | "clips" | "downloads";
export type Progress = { stage: Stage; percent: number; message: string };
export type ResultClip = Clip & { url: string; blob: Blob; filename: string };

const CORE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
let instance: FFmpeg | null = null;

async function getFFmpeg() {
  if (instance) return instance;
  const ff = new FFmpeg();
  await ff.load({
    coreURL: await toBlobURL(`${CORE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE}/ffmpeg-core.wasm`, "application/wasm"),
  });
  instance = ff;
  return ff;
}

export class HypeError extends Error { readonly isHype = true; }

export async function processVideo(file: File, onProgress: (p: Progress) => void): Promise<ResultClip[]> {
  onProgress({ stage: "upload", percent: 2, message: "Loading the video engine…" });
  const ff = await getFFmpeg();
  const dir = "/in";
  try { await ff.createDir(dir); } catch { /* exists */ }
  // Mount the file without copying it into memory.
  await ff.mount("WORKERFS" as never, { files: [file] }, dir);
  const input = `${dir}/${file.name}`;
  try {
    onProgress({ stage: "upload", percent: 8, message: "Reading video details…" });
    const logs: string[] = [];
    const onLog = ({ message }: { message: string }) => logs.push(message);
    ff.on("log", onLog);
    await ff.exec(["-hide_banner", "-i", input]);
    ff.off("log", onLog);
    const info = logs.join("\n");
    if (!/Stream #.*Video:/.test(info)) throw new HypeError("This file isn't a readable video. Please choose an MP4, MOV or WEBM file.");
    if (!/Stream #.*Audio:/.test(info)) throw new HypeError("This video has no sound, so Hype Finder can't score its energy.");
    const m = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
    const duration = m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
    if (duration < 18) throw new HypeError("This video is too short. It needs to be at least about 18 seconds long.");

    onProgress({ stage: "audio", percent: 10, message: "Listening for loudness spikes and sudden changes…" });
    const onAudio = ({ progress }: { progress: number }) =>
      onProgress({ stage: "audio", percent: 10 + Math.round(Math.min(1, Math.max(0, progress)) * 25), message: "Analyzing audio…" });
    ff.on("progress", onAudio);
    const rc = await ff.exec(["-v", "error", "-i", input, "-vn", "-ac", "1", "-ar", "8000", "-f", "s16le", "audio.pcm"]);
    ff.off("progress", onAudio);
    if (rc !== 0) throw new HypeError("Hype Finder couldn't read the audio track in this video.");
    const pcm = (await ff.readFile("audio.pcm")) as Uint8Array;
    await ff.deleteFile("audio.pcm");
    const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));

    onProgress({ stage: "moments", percent: 38, message: "Ranking the most exciting moments…" });
    const clips = findClips(levelsFromPcm(samples), duration);
    if (!clips.length) throw new HypeError("No moments of at least 15 seconds were found. Try a longer video.");

    const results: ResultClip[] = [];
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const base = 40 + (i / clips.length) * 55;
      const span = 55 / clips.length;
      const label = `Creating vertical clip ${i + 1} of ${clips.length}…`;
      onProgress({ stage: "clips", percent: Math.round(base), message: label });
      const onClip = ({ progress }: { progress: number }) =>
        onProgress({ stage: "clips", percent: Math.round(base + Math.min(1, Math.max(0, progress)) * span), message: label });
      ff.on("progress", onClip);
      const out = `hype_${String(i + 1).padStart(2, "0")}.mp4`;
      const code = await ff.exec([
        "-y", "-v", "error", "-ss", String(c.start), "-i", input, "-t", String(c.end - c.start),
        "-vf", "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24", "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", out,
      ]);
      ff.off("progress", onClip);
      if (code !== 0) throw new HypeError("FFmpeg couldn't export a clip from this video. Try converting it to MP4 first.");
      const data = (await ff.readFile(out)) as Uint8Array;
      await ff.deleteFile(out);
      const blob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
      results.push({ ...c, blob, url: URL.createObjectURL(blob), filename: out });
    }
    onProgress({ stage: "downloads", percent: 100, message: `Done — ${results.length} clips ready.` });
    return results;
  } finally {
    try { await ff.unmount(dir); } catch { /* ignore */ }
  }
}
