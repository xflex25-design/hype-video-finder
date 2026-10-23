// Port of hype_finder.py's ranking algorithm (audio energy + sudden rises).
export type Clip = { start: number; end: number; peak: number; score: number; peakDb: number };

export function levelsFromPcm(samples: Int16Array, rate = 8000): number[] {
  const win = rate / 4; // 0.25 s windows
  const out: number[] = [];
  for (let j = 0; j + win <= samples.length; j += win) {
    let sq = 0;
    for (let k = j; k < j + win; k++) sq += samples[k] * samples[k];
    const rms = Math.sqrt(sq / win) / 32768;
    out.push(20 * Math.log10(Math.max(rms, 1e-6)));
  }
  return out;
}

const r = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

export function findClips(levels: number[], duration: number, limit = 8): Clip[] {
  const dt = 0.25;
  const n = levels.length;
  if (!n) return [];
  const smooth = levels.map((_, i) => {
    const lo = Math.max(0, i - 1), hi = Math.min(n, i + 3);
    let s = 0;
    for (let k = lo; k < hi; k++) s += levels[k];
    return s / (hi - lo);
  });
  const sorted = [...smooth].sort((a, b) => a - b);
  const floor = sorted[Math.max(0, Math.floor(n * 0.2) - 1)];
  const ceiling = sorted[n - 1];
  const dynamic = Math.max(1, ceiling - floor);
  const raw = smooth.map((level, i) => {
    const jump = i >= 4 ? Math.max(0, level - smooth[i - 4]) : 0;
    const rel = Math.max(0, Math.min(1, (level - floor) / dynamic));
    return 0.75 * rel + 0.25 * Math.min(1, jump / 18);
  });
  const candidates = raw.map((_, i) => i).sort((a, b) => raw[b] - raw[a]);
  const selected: Clip[] = [];
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
      if (j * dt >= start + 15 && quiet >= 8) { end = j * dt - 1.75; break; }
    }
    end = Math.min(duration, Math.max(start + 15, Math.min(start + 45, end)));
    if (end - start < 15) continue;
    const a = Math.floor(start / dt), b = Math.min(n, Math.floor(end / dt));
    let sum = 0;
    for (let k = a; k < b; k++) sum += raw[k];
    const avg = sum / Math.max(1, b - a);
    const score = Math.max(1, Math.min(10, 10 * (0.72 * raw[pi] + 0.28 * avg)));
    selected.push({ start: r(start), end: r(end), peak: r(pt), score: r(score, 1), peakDb: r(pe, 1) });
    if (selected.length >= 24) break;
  }
  selected.sort((x, y) => y.score - x.score);
  const final: Clip[] = [];
  for (const c of selected) {
    if (final.some((x) => c.start < x.end && c.end > x.start)) continue;
    final.push(c);
    if (final.length >= limit) break;
  }
  return final;
}
