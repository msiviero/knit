# Typescript lightweight dependency injection container and http server framework

## Installation

```
npm i @msiviero/knit
```

## Dependency injection

Base usage is simple as:

```typescript
import { Container, injectable } from "@msiviero/knit";

@injectable()
class EmailService {
  public sendEmail(recipient: string) {
    // omitted
  }
}

@injectable()
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

@injectable(Scope.Prototype)
class EmailService {
  public sendEmail(recipient: string) {
    // omitted
  }
}
```

## Register custom provider

```typescript

@provider<EmailService>(EmailService, Scope.Prototype)
export class EmailServiceProvider {
    public provide = () => new EmailService();
}

Container.getInstance().registerProvider(EmailServiceProvider);

@injectable()
class MyApplication {
  constructor(public readonly emailService: EmailService) { }
}
```

## Inline declare a provider

```typescript

Container
  .getInstance()
  .registerTokenProvider("inject:email-service", class implements Provider<EmailService> {
    public provide = () => ({
      sendEmail: (recipient: string) => {
        // omitted
      }
    });
  });

@injectable()
class MyApplication {
  constructor(@inject("inject:EmailService") public readonly emailService: EmailService) { }
}
```

## Register interface provider

```typescript

interface EmailService {
  sendEmail: (recipient: string) => void;
}

@provider<EmailService>("inject:EmailService", Scope.Prototype)
export class EmailServiceProvider {
    public provide = () => ({
      sendEmail: (recipient: string) => {
        // omitted
      }
    });
}

Container.getInstance().registerProvider(EmailServiceProvider);

@injectable()
class MyApplication {
  constructor(@inject("inject:EmailService") public readonly emailService: EmailService) { }
}
```

## Configuration

```typescript
@configuration()
export class DepConfig {
    public myname = "deps";
}

@configuration()
export class AppConfig {

    public myname = this.dep.myname + "_blabla";

    constructor(private readonly dep: DepConfig) { }
    public fruit = () => "banana";
}

@injectable()
class ConfigurableClass {
    constructor(
        @config("AppConfig:myname") public readonly myname: string,
        @config("AppConfig:fruit") public readonly fruit: string,
        @env("BLA_BLA") public readonly envValue: string,
        @env("NON_EXISTENT_BLA_BLA", "bla_bla2") public readonly envValueWithDefault: string,
        @env("NON_EXISTENT_BLA_BLA2") public readonly envValueWithoutDefault: string,
        @env("A_NUMBER", 0, converters.number) public readonly envNumberValue: number,
        @env("A_LIST", undefined, converters.list) public readonly envListalue: string[],
    ) { }
}
```


## Http server

```typescript

import { injectable } from "./dependency-injection";
import { api, Exchange, HttpMethod, HttpServer, route } from "./server";

@injectable()
class TestService {
    public readonly who: string = "world";
}

@api()
class ApiClass {

    constructor(
        private readonly testService: TestService,
    ) { }

    @route(HttpMethod.GET, "/hello")
    public async getEndpoint(exchange: Exchange) {
        exchange.response.send({ hello: this.testService.who });
    }
}

HttpServer
    .getInstance()
    .api(ApiClass)
    .start();
```

## Validate input via json schema

```typescript
@route(HttpMethod.GET, "/it-throws-validation-error", {
        querystring: {
            type: "object",
            required: [
                "mandatory",
            ],
            properties: {
                mandatory: { type: "number" },
            },
        },
    })
    public async getEndpointValidated(exchange: Exchange) {
        return exchange.response.send({ status: "ok" });
    }
```

## Http endpoint testing

```typescript

describe("Http server custom instance", () => {

    const container = new Container()
        .register(ApiClass, Scope.Singleton)
        .registerProvider("service:test", class implements Provider<TestService> {
            public provide = () => new TestService("world2");
        }, Scope.Singleton);

    const httpServer = new HttpServer(container)
        .api(ApiClass);

    beforeAll(() => httpServer.start());
    afterAll(() => httpServer.stop());

    it("should register endpoint and serve requests", async () => {

        const response = await supertest(httpServer.app.server)
            .get("/hello")
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({ hello: "world2" }));
    });
});
```

## Benchmarks (MacBook Pro 2,2 GHz Intel Core i7 16GB ram)
```shell
npx autocannon -c1000 -l http://127.0.0.1:8080/hello
npx: installed 34 in 1.485s
Running 10s test @ http://127.0.0.1:8080/hello
1000 connections

┌─────────┬───────┬───────┬───────┬───────┬──────────┬──────────┬───────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev    │ Max       │
├─────────┼───────┼───────┼───────┼───────┼──────────┼──────────┼───────────┤
│ Latency │ 37 ms │ 38 ms │ 53 ms │ 70 ms │ 39.97 ms │ 11.06 ms │ 231.62 ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴──────────┴───────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Req/Sec   │ 15527   │ 15527   │ 25743   │ 25823   │ 24752.37 │ 2920.41 │ 15525   │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Bytes/Sec │ 2.55 MB │ 2.55 MB │ 4.22 MB │ 4.24 MB │ 4.06 MB  │ 479 kB  │ 2.55 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┴─────────┘

Req/Bytes counts sampled once per second.

┌────────────┬──────────────┐
│ Percentile │ Latency (ms) │
├────────────┼──────────────┤
│ 0.001      │ 35           │
├────────────┼──────────────┤
│ 0.01       │ 35           │
├────────────┼──────────────┤
│ 0.1        │ 36           │
├────────────┼──────────────┤
│ 1          │ 36           │
├────────────┼──────────────┤
│ 2.5        │ 37           │
├────────────┼──────────────┤
│ 10         │ 37           │
├────────────┼──────────────┤
│ 25         │ 38           │
├────────────┼──────────────┤
│ 50         │ 38           │
├────────────┼──────────────┤
│ 75         │ 39           │
├────────────┼──────────────┤
│ 90         │ 42           │
├────────────┼──────────────┤
│ 97.5       │ 53           │
├────────────┼──────────────┤
│ 99         │ 70           │
├────────────┼──────────────┤
│ 99.9       │ 227          │
├────────────┼──────────────┤
│ 99.99      │ 231          │
├────────────┼──────────────┤
│ 99.999     │ 231          │
└────────────┴──────────────┘

272k requests in 11.14s, 44.7 MB read
```
