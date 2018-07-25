import { Container } from "../src/container";
import { component, inject } from "../src/decorators";
import { Provider, Scope } from "../src/types";

test("Should correctly inject constructor params", () => {

  @component()
  class Test2 { }

  @component()
  class Test {
    constructor(public readonly test2: Test2) { }
  }

  const t1 = Container.getInstance().resolve(Test);

  expect(t1).not.toBeNull();
  expect(t1).toBeInstanceOf(Test);

  expect(t1.test2).not.toBeNull();
  expect(t1.test2).toBeInstanceOf(Test2);
});

test("Should always build new instances with prototype scope", () => {

  @component(Scope.Prototype)
  class Test3 { }

  @component()
  class Test2 {
    constructor(public readonly test2: Test3) { }
  }

  @component()
  class Test {
    constructor(public readonly test2: Test3) { }
  }

  const container = Container.getInstance();

  const t1 = container.resolve(Test);
  const t2 = container.resolve(Test2);

  expect(t1).not.toBeNull();
  expect(t1).toBeInstanceOf(Test);

  expect(t2).not.toBeNull();
  expect(t2).toBeInstanceOf(Test2);

  expect(t1.test2 !== t2.test2).toBeTruthy();
});

test("Should reuse instances with singleton scope", () => {

  @component(Scope.Singleton)
  class Test3 { }

  @component()
  class Test2 {
    constructor(public readonly test2: Test3) { }
  }

  @component()
  class Test {
    constructor(public readonly test2: Test3) { }
  }

  const container = Container.getInstance();

  const t1 = container.resolve(Test);
  const t2 = container.resolve(Test2);

  expect(t1).not.toBeNull();
  expect(t1).toBeInstanceOf(Test);

  expect(t2).not.toBeNull();
  expect(t2).toBeInstanceOf(Test2);

  expect(t1.test2 === t2.test2).toBeTruthy();
});

test("Should register providers correctly", () => {

  const container = Container.getInstance();

  class Test2 { }

  container.provide(Test2, () => new Test2());

  @component()
  class Test {
    constructor(public readonly test2: Test2) { }
  }

  const t1 = container.resolve(Test);

  expect(t1).not.toBeNull();
  expect(t1).toBeInstanceOf(Test);

  expect(t1.test2).not.toBeNull();
  expect(t1.test2).toBeInstanceOf(Test2);
});

test("Should inject named parameters correctly", () => {

  const container = Container.getInstance();

  interface Greeter {
    hello: () => string;
  }

  container.provide("di:Greeter", () => {
    return {
      hello: () => "Hello World",
    };
  }, Scope.Singleton);

  @component()
  class Test {
    constructor(@inject("di:Greeter") public readonly greeter: Greeter) { }
  }

  const instanceOfGreeter = (object: any): object is Greeter =>
    "hello" in object && typeof object.hello === "function";

  const t1 = container.resolve(Test);

  expect(t1).not.toBeNull();
  expect(t1).toBeInstanceOf(Test);

  expect(t1.greeter).not.toBeNull();
  expect(t1.greeter.hello()).toEqual("Hello World");
  expect(instanceOfGreeter(t1.greeter)).toBeTruthy();
});

test("Should correctly wrap singleton providers", () => {

  const container = Container.getInstance();

  const provider: Provider<number> = () => {
    return Math.random() * 10;
  };

  container.provide("test-di:provider", provider);

  @component(Scope.Prototype)
  class Test {
    constructor(@inject("test-di:provider") public readonly test2: number) { }
  }

  const t1 = container.resolve(Test);
  const t2 = container.resolve(Test);

  expect(t1.test2).toBe(t2.test2);
});

test("Should correctly use prototype providers", () => {

  const container = Container.getInstance();

  const provider: Provider<number> = () => {
    return Math.random() * 10;
  };

  container.provide("test-di:provider2", provider, Scope.Prototype);

  @component(Scope.Prototype)
  class Test {
    constructor(@inject("test-di:provider2") public readonly test2: number) { }
  }

  const t1 = container.resolve(Test);
  const t2 = container.resolve(Test);

  expect(t1.test2).not.toBe(t2.test2);
});
