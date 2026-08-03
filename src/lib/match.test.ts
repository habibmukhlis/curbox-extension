import { describe, expect, it } from "vitest";
import { matchKeyword } from "./match";

const loc = (domain: string, path = "") => ({ domain, path });

describe("Android-compatible keyword matching", () => {
  it("matches a whole domain but not a lookalike or subdomain", () => {
    expect(matchKeyword(loc("youtube.com", "/shorts?id=1#clip"), "youtube.com")).toBe(true);
    expect(matchKeyword(loc("m.youtube.com", "/shorts"), "youtube.com")).toBe(false);
    expect(matchKeyword(loc("notyoutube.com"), "youtube.com")).toBe(false);
  });

  it("uses path segment boundaries", () => {
    expect(matchKeyword(loc("youtube.com", "/shorts/123"), "/shorts")).toBe(true);
    expect(matchKeyword(loc("youtube.com", "/shorts?id=1"), "/shorts")).toBe(true);
    expect(matchKeyword(loc("youtube.com", "/shortstuff"), "/shorts")).toBe(false);
  });

  it("supports optional-subdomain globs and the root domain", () => {
    expect(matchKeyword(loc("youtube.com"), "*.youtube.com")).toBe(true);
    expect(matchKeyword(loc("m.youtube.com", "/watch"), "*.youtube.com")).toBe(true);
    expect(matchKeyword(loc("youtube.com.evil.test"), "*.youtube.com")).toBe(false);
  });

  it("matches raw regex against path, query, and fragment", () => {
    expect(matchKeyword(loc("example.com", "/feed?mode=reels#top"), "r:reels#top$")).toBe(true);
    expect(matchKeyword(loc("example.com", "/feed"), "r:[invalid")).toBe(false);
  });
});
