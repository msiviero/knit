export enum Scope {
  Prototype,
  Singleton,
}

export type Provider<T> = () => T;
export type InjectionToken<T> = Constructor<T> | string;

export interface Constructor<T> { new(...args: any[]): T; }

export interface InjectionMeta<T> {
  readonly scope: Scope;
  readonly params: InjectionToken<T>;
}

export interface TokenRegistry<T> {
  readonly [key: string]: Constructor<T>;
}
