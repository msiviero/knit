import "reflect-metadata";

export const TOKEN_KEY = "inject:token";

import { Container } from "./container";
import { Constructor, Scope } from "./types";

export function component<T>(scope: Scope = Scope.Singleton): (target: Constructor<T>) => void {
  return (target: Constructor<T>): void => {
    Container.getInstance().register(target, scope);
  };
}

export function inject(key: string) {
  return (target: any, _: string | symbol, parameterIndex: number) => {
    const namedTokens = Reflect.getOwnMetadata(TOKEN_KEY, target) || {};
    namedTokens[parameterIndex] = key;
    Reflect.defineMetadata(TOKEN_KEY, namedTokens, target);
  };
}
