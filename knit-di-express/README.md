Typescript lightweight dependency injection container for express

## Installation

```
yarn add @msiviero/knit-di-express
```

## Example of usage

Base usage:

```typescript
import * as express from "express";
import { 
  ApiContainer, 
  api,
  component, 
  Container, 
  Exchange,
  get
} from "@msiviero/knit-di-express";

const app = express();
const apiContainer = ApiContainer.getInstance();

@component()
class Greeter {
  public greet(who: string) {
    return `Hello ${who}`;
  }
}

@api("/api/v1")
class ApiController {

  constructor(private readonly greeter: Greeter) { }

  @get("/hello")
  public hello(exchange: Exchange) {
    const who: string = exchange.request.query.who || "Nobody";
    exchange.response.json({
      message: this.greeter.greet(who),
    });
  }
}

apiContainer.registerApi(app, ApiController);
app.listen(3000);
```

## Mocking dependencies

Registering mock dependencies for unit tests can be easily achieved via:

```typescript
const app = express();
const apiContainer = ApiContainer.withContainer(Container.newContainer());

@component()
class Greeter {
  public greet(who: string) {
    return `Hello ${who}`;
  }
}

class CustomGreeter extends Greeter {
  public greet(who: string) {
    return `Custom Hello ${who}`;
  }
}

apiContainer.container.provide(Greeter, () => new CustomGreeter());

@api("/api/v1")
class ApiController {

  constructor(private readonly greeter: Greeter) { }

  @get("/hello")
  public hello(exchange: Exchange) {
    const who: string = exchange.request.query.who || "Nobody";
    exchange.response.json({
      message: this.greeter.greet(who),
    });
  }
}

apiContainer.registerApi(app, ApiController);
```