import "reflect-metadata";
import { Constructor, Container, Scope } from "./dependency-injection";

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

export function env(key: string, defaultValue?: string) {
    const provider = class { public provide = () => process.env[key] || (defaultValue || ""); };
    Container.getInstance().registerTokenProvider(`env:${key}`, provider, Scope.Prototype);

    return (target: any, _: string | symbol, parameterIndex: number) => {
        const namedTokens = Reflect.getOwnMetadata("__injection_token", target) || {};
        namedTokens[parameterIndex] = `env:${key}`;
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
