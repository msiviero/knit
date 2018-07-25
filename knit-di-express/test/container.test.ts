import * as express from "express";
import * as request from "supertest";
import {
  api,
  ApiContainer,
  component,
  Container,
  Exchange,
  get,
} from "../src/index";
import { resolve } from "dns";

test("Should inject routes with default api endpoint", async () => {
  const app = express();
  const apiContainer = ApiContainer.getInstance();

  @api()
  class ApiController {

    @get("/hello")
    public hello(exchange: Exchange) {
      exchange.response.json({
        message: "Hello World",
      });
    }
  }

  apiContainer.registerApi(app, ApiController);

  const response = await request(app)
    .get("/hello")
    .set("Accept", "application/json")
    .expect(200);

  expect(response.body.message).toEqual("Hello World");
});

test("Should inject api dependencies", async () => {

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

  const response = await request(app)
    .get("/api/v1/hello?who=World")
    .set("Accept", "application/json")
    .expect(200);

  expect(response.body.message).toEqual("Hello World");
});

test("Should inject api dependencies with custom provider", async () => {

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

  const response = await request(app)
    .get("/api/v1/hello?who=World")
    .set("Accept", "application/json")
    .expect(200);

  expect(response.body.message).toEqual("Custom Hello World");
});

test("Should inject async routest", async () => {
  const app = express();
  const apiContainer = ApiContainer.getInstance();

  @api()
  class ApiController {

    @get("/hello")
    public async hello(exchange: Exchange) {

      const message = await new Promise((resolve) => {
        setTimeout(() => resolve("Hello Async World"), 30);
      });

      exchange.response.json({ message });
    }
  }

  apiContainer.registerApi(app, ApiController);

  const response = await request(app)
    .get("/hello")
    .set("Accept", "application/json")
    .expect(200);

  expect(response.body.message).toEqual("Hello Async World");
});