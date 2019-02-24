import "reflect-metadata";

type InjectionToken<T> = Constructor<T> | string;
interface TokenRegistry<T> { readonly [key: string]: Constructor<T>; }
interface Provider<T> { provide: (...args: any[]) => T; }

export enum Scope { Prototype, Singleton }
export type Constructor<T> = new (...args: any[]) => T;

export function provider<T>(type: InjectionToken<T>, scope: Scope = Scope.Singleton) {
    return (target: Constructor<Provider<T | PromiseLike<T>>>) => {
        Container.getInstance().registerProvider<T>(type, target, scope);
    };
}

export function injectable<T>(scope: Scope = Scope.Singleton) {
    return (target: Constructor<T>) => {
        Container.getInstance().register(target, scope);
    };
}

export function inject(key: string) {
    return (target: any, _: string | symbol, parameterIndex: number) => {
        const namedTokens = Reflect.getOwnMetadata("__injection_token", target) || {};
        namedTokens[parameterIndex] = key;
        Reflect.defineMetadata("__injection_token", namedTokens, target);
    };
}

export class Container {

    public static getInstance = () => Container.instance;
    private static readonly instance = new Container();

    private static getCtorParams<T>(ctor: Constructor<T>) {
        const params: Array<Constructor<T>> = Reflect.getOwnMetadata("design:paramtypes", ctor) || [];
        const injectionTokens: TokenRegistry<T> = Reflect.getOwnMetadata("__injection_token", ctor) || {};
        Object.keys(injectionTokens).forEach((idx) => params[+idx] = injectionTokens[idx]);
        return params;
    }

    private readonly dependencies = new Map<InjectionToken<any>, Constructor<Provider<any | PromiseLike<any>>>>();
    private readonly cache = new Map<InjectionToken<any>, any>();

    public register<T>(type: Constructor<T>, scope: Scope) {
        const provide = () => this.createInstance(type);
        this.registerProvider(type, class implements Provider<T> { public provide = provide; }, scope);
    }

    public registerProvider<T>(
        token: InjectionToken<T>,
        providerCtor: Constructor<Provider<T | PromiseLike<T>>>,
        scope: Scope,
    ) {
        if (this.dependencies.has(token)) {
            const tokenName = typeof token === "string" ? token : token.name;
            throw new Error(`Token already registered [token=${tokenName}]`);
        }
        Reflect.defineMetadata("__injection_singleton", scope === Scope.Singleton, providerCtor);
        this.dependencies.set(token, providerCtor);
    }

    public resolve<T>(token: InjectionToken<T>): T {
        const providerCtor = this.dependencies.get(token);
        if (!providerCtor) {
            const tokenName = typeof token === "string" ? token : token.name;
            throw new Error(`Error resolving token [token=${tokenName}]`);
        }
        const isSingleton = Reflect.getOwnMetadata("__injection_singleton", providerCtor) || false;
        if (!isSingleton) {
            return this.createInstance(providerCtor).provide();
        }
        if (!this.cache.has(token)) {
            this.cache.set(token, this.createInstance(providerCtor).provide());
        }
        return this.cache.get(token);
    }

    private createInstance = <T>(ctor: Constructor<T>) =>
        new ctor(...Container.getCtorParams(ctor).map((dependency: Constructor<any>) => this.resolve(dependency)))
}
