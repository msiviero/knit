import "reflect-metadata";
import { Constructor, Container, Scope } from "./dependency-injection";

export type ConvertFunction = (value?: string) => unknown | undefined;

export const converters = {
    string: (value?: string) => value,
    number: (value?: string) => value ? parseInt(value, 10) : undefined,
    list: (value?: string) => value ? value.split(",").map((chunk) => chunk.trim()) : undefined,
} as const;

class ConfigProviders {

    public static getInstance = () => ConfigProviders.instance;
    private static readonly instance = new ConfigProviders();

    private readonly dependencies = new Map<string, Constructor<any | PromiseLike<any>>>();

    private constructor() { }

    public register(key: string, ctor: Constructor<any | PromiseLike<any>>) {
        this.dependencies.set(key, ctor);
    }

    public get = (key: string) => this.dependencies.get(key);

    public providersMap = () => this.dependencies;
}

export function configuration<T>() {
    return (target: Constructor<T>) => {
        Container.getInstance().register(target, Scope.Singleton);
        ConfigProviders.getInstance().register(target.name, target);
    };
}

const environmentProvider = (name: string, convertFunction: ConvertFunction, defaultValue?: any) => {
    return class EnvironmentProvider { public provide = () => convertFunction(process.env[name]) || defaultValue; };
};

export function env(name: string, defaultValue?: unknown, transformFn: ConvertFunction = converters.string) {

    const container = Container.getInstance();
    const tokenName = `@env:${name}`;

    container.unsafeRegisterTokenProvider(
        tokenName,
        environmentProvider(name, transformFn, defaultValue),
        Scope.Prototype);

    return (target: any, _: string | symbol, parameterIndex: number) => {
        const namedTokens = Reflect.getOwnMetadata("__injection_token", target) || {};
        namedTokens[parameterIndex] = tokenName;
        Reflect.defineMetadata("__injection_token", namedTokens, target);
    };
}

export function config(key: string, scope: Scope = Scope.Prototype) {
    const [configClass, property] = key.split(":");
    const configProvider = ConfigProviders.getInstance().get(configClass);
    if (!configProvider) {
        throw new Error(`Invalid config provider [class=${configClass}]`);
    }
    const configProperty = Container.getInstance().resolve(configProvider)[property];
    const provider = class {
        public provide = () => typeof configProperty === "function" ? configProperty() : configProperty;
    };
    Container.getInstance().registerTokenProvider(`${configClass}:${property}`, provider, scope);

    return (target: any, _: string | symbol, parameterIndex: number) => {
        const namedTokens = Reflect.getOwnMetadata("__injection_token", target) || {};
        namedTokens[parameterIndex] = key;
        Reflect.defineMetadata("__injection_token", namedTokens, target);
    };
}
