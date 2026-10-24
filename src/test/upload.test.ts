import { describe, it, expect } from "vitest";
import { validateFile, validateUrl } from "@/lib/upload";

describe("upload rules", () => {
  it("accepts mp4/mov/webm", () => {
    expect(validateFile({ name: "a.MOV", size: 10 })).toBeNull();
  });
  it("rejects other formats", () => {
    expect(validateFile({ name: "a.avi", size: 10 })).not.toBeNull();
  });
  it("rejects files over 2 GB", () => {
    expect(validateFile({ name: "a.mp4", size: 2 * 1024 ** 3 + 1 })).not.toBeNull();
  });
  it("accepts valid YouTube links and rejects invalid IDs", () => {
    expect(validateUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(validateUrl("https://youtu.be/dQw4w9WgXcQ")).toBeNull();
    expect(validateUrl("https://youtu.be/x")).toMatch(/Invalid YouTube URL/);
  });
  it("accepts direct video file links", () => {
    expect(validateUrl("https://example.com/video.mp4")).toBeNull();
  });
});
