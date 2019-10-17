import * as supertest from "supertest";
import { Container, inject, Provider, provider, Scope } from "../src/dependency-injection";
import { api, Exchange, HttpError, HttpMethod, HttpServer, route } from "../src/server";

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

    @route(HttpMethod.GET, "/it-throws-error")
    public async getEndpointWithError(_: Exchange) {
        throw new Error("Fake test error");
    }

    @route(HttpMethod.GET, "/it-throws-custom-error")
    public async getEndpointWithCustomError(_: Exchange) {
        throw new HttpError(404, "No result found");
    }

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
    public async getEndpointValidated(_: Exchange) {
        return _.response.send({ status: "ok" });
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

    it("should handle generic exceptions", async () => {

        const response = await supertest(httpServer.getServer())
            .get("/it-throws-error")
            .expect(500)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({
            statusCode: 500,
            error: "Fake test error",
        }));
    });

    it("should handle custom exceptions", async () => {

        const response = await supertest(httpServer.getServer())
            .get("/it-throws-custom-error")
            .expect(404)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({
            statusCode: 404,
            error: "No result found",
        }));
    });

    it("should throw validation error", async () => {

        const response = await supertest(httpServer.getServer())
            .get("/it-throws-validation-error?mandatory=pippo")
            .expect(400)
            .expect("Content-Type", "application/json; charset=utf-8");

        expect(response.text).toEqual(JSON.stringify({
            statusCode: 400,
            error: "Error: querystring.mandatory should be number",
        }));
    });

    it("should not throw validation error", async () => {
        await supertest(httpServer.getServer())
            .get("/it-throws-validation-error?mandatory=123")
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8");
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
