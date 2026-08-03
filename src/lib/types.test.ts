import { describe, expect, it } from "vitest";
import { normalizeSettings } from "./types";

function legacyGroup(mode: "usage" | "time" | "on-open", active = true) {
  return {
    id: "g",
    name: "Legacy",
    enabled: true,
    matchers: ["example.com"],
    mode,
    schedule: {
      uniform: true,
      days: Array.from({ length: 7 }, () => ({ active, limitMinutes: 25, ranges: [{ start: 540, end: 1020 }] })),
    },
    warning: { challenge: "wait", sentence: "", waitType: "fixed", unlockMinutes: 5, delaySeconds: 0, customMessage: "", proceedLimit: 0, proceedWindowMinutes: 60 },
  };
}

describe("settings migration", () => {
  it("turns legacy allowed hours into equivalent active restriction hours", () => {
    const settings = normalizeSettings({ groups: [legacyGroup("time")], focusGroups: [] });
    expect(settings.schemaVersion).toBe(2);
    expect(settings.groups[0].schedule.days[0].ranges).toEqual([
      { start: 0, end: 540 },
      { start: 1020, end: 1440 },
    ]);
    expect(settings.groups[0].schedule.days[0].limitMinutes).toBe(25);
  });

  it("preserves legacy usage as an all-day limit", () => {
    const settings = normalizeSettings({ groups: [legacyGroup("usage")], focusGroups: [] });
    expect(settings.groups[0].schedule.days[0].ranges).toEqual([{ start: 0, end: 1440 }]);
    expect(settings.groups[0].schedule.days[0].limitMinutes).toBe(25);
  });

  it("preserves on-open behavior even if the unused legacy day was disabled", () => {
    const settings = normalizeSettings({ groups: [legacyGroup("on-open", false)], focusGroups: [] });
    expect(settings.groups[0].onEachOpen).toBe(true);
    expect(settings.groups[0].schedule.days.every((day) => day.active)).toBe(true);
  });
});
