import { Container, Scope } from "@msiviero/knit-di/dist";
import { Express } from "express";
import { API_TOKEN, ROUTE_TOKEN } from "./decorators";
import { Constructor, Exchange, HttpMethod, RouteFn } from "./types";

interface ApiMeta {
  readonly path: string;
}

interface RouteMeta {
  readonly method: HttpMethod;
  readonly path: string;
  readonly key: string;
  readonly descriptor: TypedPropertyDescriptor<RouteFn>;
}

export class ApiContainer {

  public static withContainer(container: Container) {
    return new ApiContainer(container);
  }

  public static getInstance() {
    return this.instance;
  }

  private static readonly instance = new ApiContainer(Container.getInstance());

  private constructor(public readonly container: Container) { }

  public registerApi<T>(app: Express, ctor: Constructor<T>) {
    this.container.register(ctor, Scope.Singleton);
    const instance = this.container.resolve(ctor);

    const apiMeta: ApiMeta = Reflect.getMetadata(API_TOKEN, ctor);
    const routeMeta: RouteMeta[] = Reflect.getMetadata(ROUTE_TOKEN, instance) || [];

    routeMeta.forEach((meta) => {
      app[meta.method](`${apiMeta.path}${meta.path}`, (request, response, next) => {
        const exchange: Exchange = { request, response, next };
        meta.descriptor.value!.apply(instance, [exchange]);
      });
    });
  }
}
