import { describe, it, expect } from "vitest";
import { findClips } from "@/lib/hype-engine";

// 120 s of quiet audio with three loud bursts.
const levels = Array.from({ length: 480 }, (_, i) => {
  const t = i * 0.25;
  return [20, 60, 95].some((p) => t >= p && t < p + 4) ? -6 : -40;
});
const clips = findClips(levels, 120);

describe("hype ranking", () => {
  it("returns at most 8 clips", () => expect(clips.length).toBeLessThanOrEqual(8));
  it("clips are 15-45 s", () => clips.forEach((c) => {
    expect(c.end - c.start).toBeGreaterThanOrEqual(15);
    expect(c.end - c.start).toBeLessThanOrEqual(45);
  }));
  it("clips never overlap", () => clips.forEach((a, i) => clips.slice(i + 1).forEach((b) =>
    expect(a.start < b.end && a.end > b.start).toBe(false))));
  it("finds the loud bursts", () => expect(clips.some((c) => c.start <= 20 && c.end > 20)).toBe(true));
});
