import * as fastify from "fastify";
import { DefaultHeaders, DefaultParams, DefaultQuery, FastifyReply, FastifyRequest } from "fastify";
import { IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import "reflect-metadata";
import { Constructor, Container, Scope } from "./dependency-injection";

const API_TOKEN = "__api_token";
const ROUTE_TOKEN = "__api_token";

type HttpRequest = FastifyRequest<IncomingMessage, DefaultQuery, DefaultParams, DefaultHeaders, any>;
type HttpResponse = FastifyReply<ServerResponse>;

interface ApiMeta {
    readonly path: string;
}

interface RouteMeta {
    readonly method: HttpMethod;
    readonly path: string;
    readonly key: string;
    readonly descriptor: TypedPropertyDescriptor<RouteFn>;
}

export type RouteFn = (exchange: Exchange) => void;
export type AsyncRouteFn = (exchange: Exchange) => Promise<void>;

export type RouteMethodDescriptor = TypedPropertyDescriptor<RouteFn> | TypedPropertyDescriptor<AsyncRouteFn>;

export interface Exchange {
    readonly request: HttpRequest;
    readonly response: HttpResponse;
}

export enum HttpMethod {
    OPTIONS = "options",
    HEAD = "head",
    GET = "get",
    POST = "post",
    PUT = "put",
    PATCH = "patch",
    DELETE = "delete",
}

export function api<T>(path: string = "") {
    return (ctor: Constructor<T>) => {
        Reflect.defineMetadata(API_TOKEN, { path }, ctor);
        Container.getInstance().register(ctor, Scope.Singleton);
    };
}

export function route(method: HttpMethod, path: string) {
    return (target: object, key: string, descriptor: RouteMethodDescriptor) => Reflect
        .defineMetadata(ROUTE_TOKEN, [
            ...(Reflect.getMetadata(ROUTE_TOKEN, target) || []), { method, path, key, descriptor },
        ], target);
}

export class HttpServer {

    public static getInstance = () => HttpServer.instance;
    private static readonly instance = new HttpServer(Container.getInstance());

    public readonly app = fastify({
        logger: {
            prettyPrint: !(process.env.NODE_ENV === "production"),
        },
        trustProxy: true,
    });

    public constructor(private readonly container: Container) { }

    public api<T>(ctor: Constructor<T>) {
        const instance = this.container.resolve(ctor);
        const apiMeta: ApiMeta = Reflect.getMetadata(API_TOKEN, ctor);
        const routeMeta: RouteMeta[] = Reflect.getMetadata(ROUTE_TOKEN, instance) || [];

        routeMeta.forEach((meta) => {
            this.app[meta.method](`${apiMeta.path}${meta.path}`, (request, response) => {
                const exchange: Exchange = { request, response };
                meta.descriptor.value!.apply(instance, [exchange]);
            });
        });
        return this;
    }

    public async start(port: number) {
        try {
            await this.app.listen(port);
            const addressInfo = this.app.server.address() as AddressInfo;
            this.app.log.info(`Server started [port=${addressInfo.port}]`);
        } catch (err) {
            this.app.log.error(err);
            process.exit(1);
        }
    }

    public async stop() {
        return new Promise((resolve) => {
            this.app.close(() => {
                this.app.log.info("Server stopped");
                resolve();
            });
        });
    }

    public server() {
        return this.app.server;
    }
}
