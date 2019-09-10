import * as supertest from "supertest";
import { Container, inject, Provider, provider, Scope } from "../src/dependency-injection";
import { api, Exchange, HttpMethod, HttpServer, route } from "../src/server";

class TestService {
    constructor(public readonly who: string = "world") { }
}

@provider<TestService>("service:test")
export class TestServiceProvider {
    public provide() {
        return new TestService();
    }
}

@api()
class ApiClass {

    constructor(
        @inject("service:test") private readonly testService: TestService,
    ) { }

    @route(HttpMethod.GET, "/hello")
    public async getEndpoint(exchange: Exchange) {
        exchange.response.send({ hello: this.testService.who });
    }

    @route(HttpMethod.GET, "/it-returns")
    public getEndpointWithReturn(_: Exchange) {
        return { hello: this.testService.who };
    }

    @route(HttpMethod.GET, "/it-returns-async")
    public async getEndpointWithAsyncReturn(_: Exchange) {
        return { hello: this.testService.who };
    }
}

describe("Http server instance", () => {

    const httpServer = HttpServer
        .getInstance()
        .api(ApiClass);

    beforeAll(() => httpServer.start());
    afterAll(() => httpServer.stop());

    it("should register endpoint and serve requests", async () => {

        const response = await supertest(httpServer.getServer())
            .get("/hello")
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({ hello: "world" }));
    });

    it("should handle returns", async () => {

        const response = await supertest(httpServer.getServer())
            .get("/it-returns")
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({ hello: "world" }));
    });

    it("should handle async returns", async () => {

        const response = await supertest(httpServer.getServer())
            .get("/it-returns-async")
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({ hello: "world" }));
    });
});

describe("Http server custom instance", () => {

    const container = new Container()
        .register(ApiClass, Scope.Singleton)
        .registerTokenProvider("service:test", class implements Provider<TestService> {
            public provide = () => new TestService("world2");
        }, Scope.Singleton);

    const httpServer = new HttpServer(container)
        .api(ApiClass);

    beforeAll(() => httpServer.start());
    afterAll(() => httpServer.stop());

    it("should register endpoint and serve requests", async () => {

        const response = await supertest(httpServer.getServer())
            .get("/hello")
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({ hello: "world2" }));
    });
});
