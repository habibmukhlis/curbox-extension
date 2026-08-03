import { describe, expect, it } from "vitest";
import { AdaptiveMathChallenge } from "./adaptive-math";

describe("adaptive math challenge", () => {
  it("raises difficulty on correct answers and completes after the configured count", () => {
    const challenge = new AdaptiveMathChallenge(2, 3, () => 0.25);
    const first = challenge.currentProblem.answer;
    expect(challenge.submit(String(first))).toMatchObject({ correct: true, complete: false, solvedCount: 1 });
    expect(challenge.difficulty).toBe(4);
    expect(challenge.submit(String(challenge.currentProblem.answer))).toMatchObject({ correct: true, complete: true, solvedCount: 2 });
  });

  it("lowers difficulty without counting a wrong answer", () => {
    const challenge = new AdaptiveMathChallenge(1, 5, () => 0.5);
    expect(challenge.submit("not a number")).toMatchObject({ correct: false, complete: false, solvedCount: 0 });
    expect(challenge.difficulty).toBe(4);
  });
});
