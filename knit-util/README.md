Typescript util decorators

# Installation

```
yarn add @msiviero/knit-util
```

## Measure

Measure method execution time, even on async methods.
Usage:

```typescript
import { measure } from "@msiviero/knit-util";

class MyClass {

  @measure.track("perf:MyClass.longRunningMethod")
  public longRunningMethod() {
    // long running code
  }
}

const instance = new MyClass();

const elapsed = measure.manager.sum("perf:MyClass.longRunningMethod"); // see source for other methods
```

To avoid performance loss in production you can pass a condition which, if evaluate to false will skip the measurement 

```typescript
class MyClass {

  @measure.track("perf:MyClass.longRunningMethod", process.env.NODE_ENV === "production")
  public longRunningMethod() {
    // long running code
  }
}

const instance = new MyClass();

const elapsed = measure.manager.sum("perf:MyClass.longRunningMethod"); // see source for other methods
```
