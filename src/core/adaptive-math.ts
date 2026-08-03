export interface MathProblem {
  expression: string;
  answer: number;
}

export interface MathResult {
  correct: boolean;
  complete: boolean;
  solvedCount: number;
}

export class AdaptiveMathChallenge {
  solvedCount = 0;
  difficulty: number;
  currentProblem: MathProblem;

  constructor(
    readonly requiredAnswers = 3,
    startingDifficulty = 3,
    private readonly random: () => number = Math.random,
  ) {
    this.difficulty = clamp(Math.floor(startingDifficulty), 1, 10);
    this.currentProblem = this.createProblem();
  }

  submit(rawAnswer: string): MathResult {
    const answer = Number(rawAnswer.trim().replace(",", "."));
    const correct = Number.isFinite(answer) && Math.abs(answer - this.currentProblem.answer) < 1e-9;
    if (correct) {
      this.solvedCount += 1;
      this.difficulty = Math.min(10, this.difficulty + 1);
    } else {
      this.difficulty = Math.max(1, this.difficulty - 1);
    }
    const complete = this.solvedCount >= Math.max(1, this.requiredAnswers);
    if (!complete) this.currentProblem = this.createProblem();
    return { correct, complete, solvedCount: this.solvedCount };
  }

  private createProblem(): MathProblem {
    switch (this.difficulty) {
      case 1: return this.smallAdditionOrSubtraction();
      case 2: return this.largeAdditionOrSubtraction();
      case 3: return this.smallMultiplication();
      case 4: return this.largeMultiplication();
      case 5: return this.multiStep();
      case 6: return this.decimalProblem();
      case 7: return this.fractionProblem();
      case 8: return this.rootProblem();
      case 9: return this.powerAndFraction();
      default: return this.expertProblem();
    }
  }

  private smallAdditionOrSubtraction(): MathProblem {
    const first = this.int(2, 20);
    const second = this.int(1, first + 1);
    return this.bool()
      ? { expression: `${first} + ${second}`, answer: first + second }
      : { expression: `${first} − ${second}`, answer: first - second };
  }

  private largeAdditionOrSubtraction(): MathProblem {
    const first = this.int(20, 100);
    const second = this.int(10, first + 1);
    return this.bool()
      ? { expression: `${first} + ${second}`, answer: first + second }
      : { expression: `${first} − ${second}`, answer: first - second };
  }

  private smallMultiplication(): MathProblem {
    const first = this.int(3, 13);
    const second = this.int(3, 13);
    return { expression: `${first} × ${second}`, answer: first * second };
  }

  private largeMultiplication(): MathProblem {
    const first = this.int(12, 31);
    const second = this.int(4, 16);
    return { expression: `${first} × ${second}`, answer: first * second };
  }

  private multiStep(): MathProblem {
    const first = this.int(8, 21);
    const second = this.int(4, 13);
    const third = this.int(10, 51);
    const product = first * second;
    return this.bool()
      ? { expression: `(${first} × ${second}) + ${third}`, answer: product + third }
      : { expression: `(${first} × ${second}) − ${third}`, answer: product - third };
  }

  private decimalProblem(): MathProblem {
    const decimal = this.decimal();
    const multiplier = this.int(6, 20);
    return { expression: `${decimal} × ${multiplier}`, answer: decimal * multiplier };
  }

  private fractionProblem(): MathProblem {
    const denominators = [4, 5, 8, 10, 16, 20, 25];
    const firstDenominator = this.pick(denominators);
    const secondDenominator = this.pick(denominators);
    const firstNumerator = this.int(2, firstDenominator * 2);
    const secondNumerator = this.int(2, secondDenominator * 2);
    return {
      expression: `${firstNumerator}/${firstDenominator} + ${secondNumerator}/${secondDenominator}`,
      answer: firstNumerator / firstDenominator + secondNumerator / secondDenominator,
    };
  }

  private rootProblem(): MathProblem {
    const root = this.int(12, 51);
    const multiplier = this.int(6, 21);
    const offset = this.int(30, 201);
    return { expression: `(√${root * root} × ${multiplier}) + ${offset}`, answer: root * multiplier + offset };
  }

  private powerAndFraction(): MathProblem {
    const base = this.int(14, 31);
    const firstDenominator = this.int(6, 16);
    const secondDenominator = this.int(6, 16);
    const firstNumerator = this.int(2, firstDenominator);
    const secondNumerator = this.int(2, secondDenominator);
    const multiplier = lcm(firstDenominator, secondDenominator) * this.int(2, 7);
    const fractions = firstNumerator * (multiplier / firstDenominator) + secondNumerator * (multiplier / secondDenominator);
    return {
      expression: `${base}² − ((${firstNumerator}/${firstDenominator} + ${secondNumerator}/${secondDenominator}) × ${multiplier})`,
      answer: base * base - fractions,
    };
  }

  private expertProblem(): MathProblem {
    const base = this.int(18, 36);
    let root = this.int(8, 21);
    if ((base - root) % 2 !== 0) root += 1;
    const difference = base * base - root;
    const denominator = this.pick(Array.from({ length: 11 }, (_, i) => i + 2).filter((n) => difference % n === 0));
    const numerator = this.int(3, 13);
    const decimal = this.decimal();
    return {
      expression: `((${base}² − √${root * root}) × ${numerator}/${denominator}) + ${decimal}`,
      answer: (difference / denominator) * numerator + decimal,
    };
  }

  private decimal(): number {
    let tenths = this.int(101, 1000);
    if (tenths % 10 === 0) tenths += 1;
    return tenths / 10;
  }

  private int(from: number, until: number): number {
    return from + Math.floor(this.random() * (until - from));
  }

  private bool(): boolean {
    return this.random() < 0.5;
  }

  private pick<T>(items: T[]): T {
    return items[this.int(0, items.length)];
  }
}

function gcd(first: number, second: number): number {
  let larger = first;
  let smaller = second;
  while (smaller !== 0) [larger, smaller] = [smaller, larger % smaller];
  return larger;
}

function lcm(first: number, second: number): number {
  return (first / gcd(first, second)) * second;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
