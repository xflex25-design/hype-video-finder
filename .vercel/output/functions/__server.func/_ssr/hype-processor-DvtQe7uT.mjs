import { t as FFmpeg } from "../_libs/ffmpeg__ffmpeg.mjs";
import { t as toBlobURL } from "../_libs/ffmpeg__util.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hype-processor-DvtQe7uT.js
function levelsFromPcm(samples, rate = 8e3) {
	const win = rate / 4;
	const out = [];
	for (let j = 0; j + win <= samples.length; j += win) {
		let sq = 0;
		for (let k = j; k < j + win; k++) sq += samples[k] * samples[k];
		const rms = Math.sqrt(sq / win) / 32768;
		out.push(20 * Math.log10(Math.max(rms, 1e-6)));
	}
	return out;
}
var r = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
function findClips(levels, duration, limit = 8) {
	const dt = .25;
	const n = levels.length;
	if (!n) return [];
	const smooth = levels.map((_, i) => {
		const lo = Math.max(0, i - 1), hi = Math.min(n, i + 3);
		let s = 0;
		for (let k = lo; k < hi; k++) s += levels[k];
		return s / (hi - lo);
	});
	const sorted = [...smooth].sort((a, b) => a - b);
	const floor = sorted[Math.max(0, Math.floor(n * .2) - 1)];
	const ceiling = sorted[n - 1];
	const dynamic = Math.max(1, ceiling - floor);
	const raw = smooth.map((level, i) => {
		const jump = i >= 4 ? Math.max(0, level - smooth[i - 4]) : 0;
		return .75 * Math.max(0, Math.min(1, (level - floor) / dynamic)) + .25 * Math.min(1, jump / 18);
	});
	const candidates = raw.map((_, i) => i).sort((a, b) => raw[b] - raw[a]);
	const selected = [];
	for (const pi of candidates) {
		const pt = pi * dt;
		if (pt < 2 || pt > duration - 3) continue;
		if (selected.some((c) => Math.abs(pt - c.peak) < 7)) continue;
		const pe = smooth[pi];
		const threshold = Math.max(floor + 2, pe - 10);
		const start = Math.max(0, pt - 2);
		let end = Math.min(duration, Math.max(start + 15, pt + 5));
		let quiet = 0;
		for (let j = pi + 1; j < Math.min(n, Math.floor((pt + 43) / dt)); j++) {
			quiet = smooth[j] < threshold ? quiet + 1 : 0;
			if (j * dt >= start + 15 && quiet >= 8) {
				end = j * dt - 1.75;
				break;
			}
		}
		end = Math.min(duration, Math.max(start + 15, Math.min(start + 45, end)));
		if (end - start < 15) continue;
		const a = Math.floor(start / dt), b = Math.min(n, Math.floor(end / dt));
		let sum = 0;
		for (let k = a; k < b; k++) sum += raw[k];
		const avg = sum / Math.max(1, b - a);
		const score = Math.max(1, Math.min(10, 10 * (.72 * raw[pi] + .28 * avg)));
		selected.push({
			start: r(start),
			end: r(end),
			peak: r(pt),
			score: r(score, 1),
			peakDb: r(pe, 1)
		});
		if (selected.length >= 24) break;
	}
	selected.sort((x, y) => y.score - x.score);
	const final = [];
	for (const c of selected) {
		if (final.some((x) => c.start < x.end && c.end > x.start)) continue;
		final.push(c);
		if (final.length >= limit) break;
	}
	return final;
}
function normalizeCaptions(chunks, duration) {
	return chunks.flatMap((chunk) => {
		const start = Math.max(0, chunk.timestamp[0]);
		const end = Math.min(duration, chunk.timestamp[1] ?? duration);
		const text = chunk.text.trim();
		return text && Number.isFinite(start) && Number.isFinite(end) && end > start ? [{
			start,
			end,
			text
		}] : [];
	});
}
function captionText(text) {
	const words = text.split(/\s+/);
	const lines = [];
	let line = "";
	for (const word of words) {
		if (line && `${line} ${word}`.length > 28) {
			lines.push(line);
			line = "";
		}
		line += `${line ? " " : ""}${word}`;
	}
	if (line) lines.push(line);
	return lines.join("\n");
}
async function transcribeClip(samples, duration) {
	const { pipeline, env } = await import("../_libs/@huggingface/transformers+[...].mjs").then((n) => n.t);
	env.allowLocalModels = false;
	if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;
	const transcriber = await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", {
		device: "wasm",
		dtype: "q8"
	});
	try {
		const output = await transcriber(samples, {
			return_timestamps: true,
			chunk_length_s: 30,
			stride_length_s: 5,
			task: "transcribe"
		});
		return normalizeCaptions((Array.isArray(output) ? output[0] : output)?.chunks ?? [], duration);
	} finally {
		await transcriber.dispose();
	}
}
var caption_font_ttf_asset_default = {
	version: 1,
	asset_id: "46f33e2d-7d28-4286-8c87-1b5150f4df95",
	project_id: "62593bad-a481-4d39-9245-f45ced238e23",
	url: "/__l5e/assets-v1/46f33e2d-7d28-4286-8c87-1b5150f4df95/caption-font.ttf",
	r2_key: "a/v1/62593bad-a481-4d39-9245-f45ced238e23/46f33e2d-7d28-4286-8c87-1b5150f4df95/caption-font.ttf",
	original_filename: "caption-font.ttf",
	size: 708876,
	content_type: "font/ttf",
	created_at: "2026-10-24T01:50:59Z"
};
async function analyzeClip(transcript, duration) {
	const cleanTranscript = (transcript || "").trim().toLowerCase();
	const words = cleanTranscript.split(/\s+/).filter(Boolean);
	const firstWords = words.slice(0, 10).join(" ");
	const lastWords = words.slice(-8).join(" ");
	let score = 0;
	const reasons = [];
	const hasQuestion = firstWords.includes("?") || /^(why|how|what|did|can|do|is|are|who|where|if|have|ever)/.test(firstWords);
	const hasHookStatement = /(secret|never|stop|this|watch|don't|look|reason|nobody|everyone|must|truth)/.test(firstWords) || cleanTranscript.includes("?");
	if (hasQuestion || hasHookStatement) {
		score += 30;
		const matchedHook = firstWords.slice(0, 35);
		reasons.push(`Hook in first 2s: "${matchedHook || "Strong statement"}"`);
	} else {
		score += 15;
		reasons.push("Clear starting statement");
	}
	const matchEmotion = cleanTranscript.match(/(failed|fail|failure|secret|shocked|shock|money|dollar|rich|broke|crazy|insane|wild|unbelievable|mistake|error|die|dead|love|hate|win|lost|loss|scam|danger)/i);
	if (matchEmotion) {
		score += 20;
		reasons.push(`Emotion: ${matchEmotion[0].toLowerCase()}`);
	} else {
		score += 10;
		reasons.push("Engaging tone");
	}
	if (duration <= 35 && duration > 0) {
		score += 20;
		reasons.push(`Optimal short-form length (${Math.round(duration)}s)`);
	} else if (duration <= 45) {
		score += 10;
		reasons.push(`Good short duration (${Math.round(duration)}s)`);
	} else reasons.push("Extended duration");
	if (/(because|so|next|and|until|then|find out|watch|part 2|wait|see|\?|\.\.\.)$/.test(cleanTranscript) || /(you|this|how|why)/.test(lastWords)) {
		score += 15;
		reasons.push("Loopable ending or cliffhanger");
	} else {
		score += 8;
		reasons.push("Smooth clip resolution");
	}
	const hasNumbers = /\d+|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|percent|\$/.test(cleanTranscript);
	const hasStory = /(when|then|after|suddenly|first|finally|realized|happened|told|said)/.test(cleanTranscript);
	if (hasNumbers || hasStory) {
		score += 15;
		reasons.push(hasNumbers ? "Contains numbers or data" : "Storytelling structure detected");
	} else {
		score += 7;
		reasons.push("Direct delivery");
	}
	const finalScore = Math.min(100, Math.max(0, score));
	let label = "Low";
	if (finalScore >= 80) label = "High Viral Potential";
	else if (finalScore >= 50) label = "Good";
	return {
		score: finalScore,
		label,
		reasons: reasons.slice(0, 3)
	};
}
var CORE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
var instance = null;
async function getFFmpeg() {
	if (instance) return instance;
	const ff = new FFmpeg();
	await ff.load({
		coreURL: await toBlobURL(`${CORE}/ffmpeg-core.js`, "text/javascript"),
		wasmURL: await toBlobURL(`${CORE}/ffmpeg-core.wasm`, "application/wasm")
	});
	instance = ff;
	return ff;
}
var HypeError = class extends Error {
	isHype = true;
};
async function processVideo(file, onProgress) {
	onProgress({
		stage: "upload",
		percent: 2,
		message: "Loading the video engine…"
	});
	const ff = await getFFmpeg();
	const dir = "/in";
	try {
		await ff.createDir(dir);
	} catch {}
	await ff.mount("WORKERFS", { files: [file] }, dir);
	const input = `${dir}/${file.name}`;
	try {
		onProgress({
			stage: "upload",
			percent: 8,
			message: "Reading video details…"
		});
		const logs = [];
		const onLog = ({ message }) => logs.push(message);
		ff.on("log", onLog);
		await ff.exec([
			"-hide_banner",
			"-i",
			input
		]);
		ff.off("log", onLog);
		const info = logs.join("\n");
		if (!/Stream #.*Video:/.test(info)) throw new HypeError("This file isn't a readable video. Please choose an MP4, MOV or WEBM file.");
		if (!/Stream #.*Audio:/.test(info)) throw new HypeError("This video has no sound, so Hype Finder can't score its energy.");
		const m = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
		const duration = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
		if (duration < 18) throw new HypeError("This video is too short. It needs to be at least about 18 seconds long.");
		onProgress({
			stage: "audio",
			percent: 10,
			message: "Listening for loudness spikes and sudden changes…"
		});
		const onAudio = ({ progress }) => onProgress({
			stage: "audio",
			percent: 10 + Math.round(Math.min(1, Math.max(0, progress)) * 25),
			message: "Analyzing audio…"
		});
		ff.on("progress", onAudio);
		const rc = await ff.exec([
			"-v",
			"error",
			"-i",
			input,
			"-vn",
			"-ac",
			"1",
			"-ar",
			"8000",
			"-f",
			"s16le",
			"audio.pcm"
		]);
		ff.off("progress", onAudio);
		if (rc !== 0) throw new HypeError("Hype Finder couldn't read the audio track in this video.");
		const pcm = await ff.readFile("audio.pcm");
		await ff.deleteFile("audio.pcm");
		const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
		onProgress({
			stage: "moments",
			percent: 38,
			message: "Ranking the most exciting moments…"
		});
		const clips = findClips(levelsFromPcm(samples), duration);
		if (!clips.length) throw new HypeError("No moments of at least 15 seconds were found. Try a longer video.");
		const results = [];
		const fontResponse = await fetch(caption_font_ttf_asset_default.url);
		if (!fontResponse.ok) throw new HypeError("The caption font couldn't load. Please try again.");
		await ff.writeFile("caption-font.ttf", new Uint8Array(await fontResponse.arrayBuffer()));
		for (let i = 0; i < clips.length; i++) {
			const c = clips[i];
			if (!c) continue;
			const base = 40 + i / clips.length * 55;
			const span = 55 / clips.length;
			onProgress({
				stage: "clips",
				percent: Math.round(base),
				message: `Adding automatic captions to clip ${i + 1} of ${clips.length}…`
			});
			if (await ff.exec([
				"-y",
				"-v",
				"error",
				"-ss",
				String(c.start),
				"-i",
				input,
				"-t",
				String(c.end - c.start),
				"-vn",
				"-ac",
				"1",
				"-ar",
				"16000",
				"-f",
				"f32le",
				"caption-audio.pcm"
			]) !== 0) throw new HypeError("Couldn't read the audio for captions.");
			const audio = await ff.readFile("caption-audio.pcm");
			await ff.deleteFile("caption-audio.pcm");
			let captions;
			try {
				captions = await transcribeClip(new Float32Array(new Uint8Array(audio).buffer), c.end - c.start);
			} catch {
				throw new HypeError("Automatic captions couldn't load or run on this device. Please retry with a shorter video in a desktop browser.");
			}
			const captionFiles = [];
			let filter = "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280";
			for (const [j, caption] of captions.entries()) {
				const textFile = `caption-${j}.txt`;
				await ff.writeFile(textFile, new TextEncoder().encode(captionText(caption.text)));
				captionFiles.push(textFile);
				filter += `,drawtext=fontfile=caption-font.ttf:textfile=${textFile}:expansion=none:fontsize=36:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.78:enable='between(t,${caption.start},${caption.end})'`;
			}
			const label = `Creating vertical clip ${i + 1} of ${clips.length}…`;
			onProgress({
				stage: "clips",
				percent: Math.round(base),
				message: label
			});
			const onClip = ({ progress }) => onProgress({
				stage: "clips",
				percent: Math.round(base + Math.min(1, Math.max(0, progress)) * span),
				message: label
			});
			ff.on("progress", onClip);
			const out = `hype_${String(i + 1).padStart(2, "0")}.mp4`;
			const code = await ff.exec([
				"-y",
				"-v",
				"error",
				"-ss",
				String(c.start),
				"-i",
				input,
				"-t",
				String(c.end - c.start),
				"-vf",
				filter,
				"-c:v",
				"libx264",
				"-preset",
				"ultrafast",
				"-crf",
				"24",
				"-c:a",
				"aac",
				"-b:a",
				"128k",
				"-movflags",
				"+faststart",
				out
			]);
			ff.off("progress", onClip);
			for (const path of captionFiles) await ff.deleteFile(path);
			if (code !== 0) throw new HypeError("FFmpeg couldn't export a clip from this video. Try converting it to MP4 first.");
			const data = await ff.readFile(out);
			await ff.deleteFile(out);
			const blob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
			const viralScore = await analyzeClip(captions.map((c) => c.text).join(" "), c.end - c.start);
			results.push({
				...c,
				blob,
				url: URL.createObjectURL(blob),
				filename: out,
				captionCount: captions.length,
				viralScore
			});
		}
		onProgress({
			stage: "downloads",
			percent: 100,
			message: `Done — ${results.length} clips ready.`
		});
		return results;
	} finally {
		for (const path of ["caption-font.ttf", "caption-audio.pcm"]) try {
			await ff.deleteFile(path);
		} catch {}
		try {
			await ff.unmount(dir);
		} catch {}
	}
}
//#endregion
export { processVideo };
