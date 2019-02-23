Typescript lightweight dependency injection container

## Installation

```
yarn add @msiviero/knit-di
```

## Example of usage

Base usage is simple as:

```typescript
import { Container, component } from "@msiviero/knit-di";

@component()
class EmailService {
  public sendEmail(recipient: string) {
    // omitted
  }
}

@component()
class MyApplication {

  constructor(private readonly emailService: EmailService) { }

  public run() {
    this.emailService.sendEmail("example@gmail.com");
  }
}

const app = Container.getInstance().resolve(MyApplication);

app.run();
```

Note that all instances all singleton by default

## Injection scope

Pass desired scope as decorator parameter

```typescript

@component(Scope.Prototype)
class EmailService {
  public sendEmail(recipient: string) {
    // omitted
  }
}
```

## Register custom provider

```typescript

const container = Container.getInstance();

class EmailService {
  public sendEmail(recipient: string) {
    // omitted
  }
}

container.provide(EmailService, () => new EmailService());

@component()
class MyApplication {
  constructor(public readonly emailService: EmailService) { }
}
```

## Register interface provider

```typescript

const container = Container.getInstance();

interface EmailService {
  sendEmail: (recipient: string) => void;
}

container.provide("EmailService", () => ({
  sendEmail: (recipient: string) => {
    // omitted
  }
}));

@component()
class MyApplication {
  constructor(@inject("EmailService") public readonly emailService: EmailService) { }
}
```