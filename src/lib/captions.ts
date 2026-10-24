export type Caption = { start: number; end: number; text: string };

export function normalizeCaptions(chunks: { timestamp: [number, number | null]; text: string }[], duration: number): Caption[] {
  return chunks.flatMap((chunk) => {
    const start = Math.max(0, chunk.timestamp[0]);
    const end = Math.min(duration, chunk.timestamp[1] ?? duration);
    const text = chunk.text.trim();
    return text && Number.isFinite(start) && Number.isFinite(end) && end > start ? [{ start, end, text }] : [];
  });
}

export function captionText(text: string): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > 28) { lines.push(line); line = ""; }
    line += `${line ? " " : ""}${word}`;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

export async function transcribeClip(samples: Float32Array, duration: number): Promise<Caption[]> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;
  const transcriber = await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", { device: "wasm", dtype: "q8" });
  try {
    const output = await transcriber(samples, { return_timestamps: true, chunk_length_s: 30, stride_length_s: 5, task: "transcribe" });
    const result = Array.isArray(output) ? output[0] : output;
    return normalizeCaptions(result?.chunks ?? [], duration);
  } finally { await transcriber.dispose(); }
}