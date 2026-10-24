import { describe, it, expect } from "vitest";
import { extractYouTubeId, INVALID_YOUTUBE_URL } from "@/lib/youtube";
import { validateUrl } from "@/lib/upload";

describe("YouTube input", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s",
    " dQw4w9WgXcQ ",
    " https://youtu.be/dQw4w9WgXcQ?t=120&list=abc&ab_channel=Rick ",
  ])("extracts the exact 11-character ID from %s", (input) => {
    expect(extractYouTubeId(input)).toBe("dQw4w9WgXcQ");
  });
  it.each(["https://youtube.com/watch?v=short", "invalid", "https://youtu.be/abcdefghijkl"])("rejects invalid ID %s", (input) => {
    expect(validateUrl(input)).toBe(INVALID_YOUTUBE_URL);
  });
  it("does not accept lookalike hosts", () => {
    expect(extractYouTubeId("https://notyoutube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});