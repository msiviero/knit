import { NextFunction, Request, Response } from "express";

export interface Constructor<T> { new(...args: any[]): T; }

export type RouteFn = (exchange: Exchange) => void;
export type AsyncRouteFn = (exchange: Exchange) => Promise<void>;

export type RouteMethodDescriptor = TypedPropertyDescriptor<RouteFn> | TypedPropertyDescriptor<AsyncRouteFn>;

export interface Exchange {
  readonly request: Request;
  readonly response: Response;
  readonly next: NextFunction;
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
