import * as performance from "../src/performance";

beforeEach(() => performance.manager.clear());

test("Should measure section performance", () => {

  const runs = 1e4;
  const marker = "perf:longRunningMethod:sync";

  class ClassUnderTest {

    @performance.measure(marker)
    public longRunningMethod(char: string) {
      let acc = "";

      for (let i = 0; i < runs; i++) {
        acc += char;
      }

      return acc;
    }
  }

  const underTest = new ClassUnderTest();

  expect(underTest.longRunningMethod("x")).toBe("x".repeat(runs));
  expect(underTest.longRunningMethod("y")).toBe("y".repeat(runs));
  expect(underTest.longRunningMethod("z")).toBe("z".repeat(runs));

  const measures = performance.manager.byName(marker);
  const sum = measures[0].elapsed + measures[1].elapsed + measures[2].elapsed;

  expect(measures).toHaveLength(3);
  expect(performance.manager.sum(marker)).toBe(sum);
});

test("Should measure section performance in async", async () => {

  const marker = "perf:longRunningMethod:async";

  class ClassUnderTest {

    @performance.measure(marker)
    public longRunningMethod(): Promise<string> {
      return new Promise((resolve) => {
        setTimeout(() => resolve("x"), 150);
      });
    }
  }

  const underTest = new ClassUnderTest();
  const result = await underTest.longRunningMethod();

  expect(result).toEqual("x");

  const measures = performance.manager.byName(marker);

  expect(measures).toHaveLength(1);
  expect(performance.manager.sum(marker)).toBeGreaterThanOrEqual(150);
});

test("Should skip on condition", () => {

  const runs = 1e4;
  const marker = "perf:longRunningMethod:skip";

  class ClassUnderTest {

    @performance.measure(marker, false)
    public longRunningMethod(char: string) {
      let acc = "";

      for (let i = 0; i < runs; i++) {
        acc += char;
      }

      return acc;
    }
  }

  const underTest = new ClassUnderTest();

  expect(underTest.longRunningMethod("x")).toBe("x".repeat(runs));
  expect(performance.manager.all()).toHaveLength(0);
});
