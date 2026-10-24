import { it, expect } from "vitest";
import { normalizeCaptions } from "@/lib/captions";

it("keeps audio timing and closes missing end timestamps at the clip end", () => {
  expect(normalizeCaptions([
    { timestamp: [0, 3.5], text: " Hello " },
    { timestamp: [3.5, null], text: "world" },
  ], 15)).toEqual([{ start: 0, end: 3.5, text: "Hello" }, { start: 3.5, end: 15, text: "world" }]);
});
it("excludes empty and invalid caption intervals", () => {
  expect(normalizeCaptions([{ timestamp: [6, 3], text: "wrong" }, { timestamp: [0, 2], text: " " }], 15)).toEqual([]);
});