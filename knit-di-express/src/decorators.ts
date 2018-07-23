import "reflect-metadata";
import { Constructor, HttpMethod, RouteFn } from "./types";

export const API_TOKEN = "http:api";
export const ROUTE_TOKEN = "http:route";

export function api<T>(path: string = "") {
  return (ctor: Constructor<T>) => {
    Reflect.defineMetadata(API_TOKEN, { path }, ctor);
  };
}

export function route(method: HttpMethod, path: string) {
  return (target: object, key: string, descriptor: TypedPropertyDescriptor<RouteFn>) => Reflect
    .defineMetadata(ROUTE_TOKEN, [
      ...(Reflect.getMetadata(ROUTE_TOKEN, target) || []), { method, path, key, descriptor },
    ], target);
}

export function get(path: string) {
  return route(HttpMethod.GET, path);
}

export function post(path: string) {
  return route(HttpMethod.POST, path);
}

export function put(path: string) {
  return route(HttpMethod.PUT, path);
}

export function patch(path: string) {
  return route(HttpMethod.PATCH, path);
}

export function del(path: string) {
  return route(HttpMethod.DELETE, path);
}

export function head(path: string) {
  return route(HttpMethod.HEAD, path);
}

export function options(path: string) {
  return route(HttpMethod.OPTIONS, path);
}
