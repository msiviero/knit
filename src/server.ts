import * as fastify from "fastify";
import { DefaultHeaders, DefaultParams, DefaultQuery, FastifyReply, FastifyRequest, ServerOptions } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import { AddressInfo } from "net";
import "reflect-metadata";
import { Constructor, Container, Provider, Scope } from "./dependency-injection";
const API_TOKEN = "__api_token";
const ROUTE_TOKEN = "__api_token";

type HttpRequest = FastifyRequest<IncomingMessage, DefaultQuery, DefaultParams, DefaultHeaders, any>;
type HttpResponse = FastifyReply<ServerResponse>;

interface ServerOpts extends ServerOptions {
    readonly port?: number;
    readonly address?: string;
}

interface ApiMeta {
    readonly path: string;
}

interface RouteBinding {
    readonly apiMeta: ApiMeta;
    readonly routesMeta: RouteMeta[];
    readonly instance: any;
}

interface RouteMeta {
    readonly method: HttpMethod;
    readonly path: string;
    readonly key: string;
    readonly descriptor: TypedPropertyDescriptor<RouteFn>;
}

export type RouteFn = (exchange: Exchange) => any | void;
export type AsyncRouteFn = (exchange: Exchange) => Promise<any | void>;

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

export function route(method: HttpMethod, path: string = "") {
    return (target: object, key: string, descriptor: RouteMethodDescriptor) => Reflect
        .defineMetadata(ROUTE_TOKEN, [
            ...(Reflect.getMetadata(ROUTE_TOKEN, target) || []), { method, path, key, descriptor },
        ], target);
}

export class HttpServer {

    public static getInstance = () => HttpServer.instance;
    private static readonly instance = new HttpServer(Container.getInstance());

    private bindings: RouteBinding[] = [];
    private app?: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

    public constructor(private readonly container: Container) { }

    public api<T>(ctor: Constructor<T>) {
        const instance = this.container.resolve(ctor);
        const apiMeta: ApiMeta = Reflect.getMetadata(API_TOKEN, ctor);
        const routesMeta: RouteMeta[] = Reflect.getMetadata(ROUTE_TOKEN, instance) || [];

        this.bindings.push({ apiMeta, routesMeta, instance });
        return this;
    }

    public registerProvider<T>(
        providerCtor: Constructor<Provider<T | PromiseLike<T>>>,
        scope: Scope = Scope.Singleton,
    ) {
        this.container.registerProvider(providerCtor, scope);
        return this;
    }

    public getApp() {
        return this.app;
    }

    public getServer() {
        return this.app ? this.app.server : undefined;
    }

    public async start(serverOptions?: ServerOpts) {

        this.app = fastify(serverOptions);
        this.bindings.forEach(({ routesMeta, apiMeta, instance }) => {
            routesMeta.forEach((meta) => {
                this.app![meta.method](`${apiMeta.path}${meta.path}`, async (request, response) => {
                    const exchange: Exchange = { request, response };
                    try {
                        const result = meta.descriptor.value!.apply(instance, [exchange]);
                        if (result) {
                            response.send(await result);
                        }
                    } catch (error) {
                        response.code(500).send(error);
                    }
                });
            });
        });

        const port = serverOptions && serverOptions.port ? serverOptions.port : 0;
        const address = serverOptions && serverOptions.address ? serverOptions.address : "0.0.0.0";

        try {
            await this.app.listen(port, address);
            const addressInfo = this.app.server.address() as AddressInfo;
            this.app.log.info(`Server started [port=${addressInfo.port}]`);
        } catch (err) {
            this.app.log.error(err);
            process.exit(1);
        }
    }

    public async stop() {

        if (!this.app) {
            throw new Error("App is not running");
        }

        return new Promise((resolve) => {
            this.app!.close(() => {
                this.app!.log.info("Server stopped");
                resolve();
            });
        });
    }

}
