import "reflect-metadata";

type Constructor<T> = new (...args: any[]) => T;
type InjectionToken<T> = Constructor<T> | string;

interface TokenRegistry<T> { readonly [key: string]: Constructor<T>; }
interface Provider<T> { provide: (...args: any[]) => T; }

const TOKEN_KEY = "__injection_token";
const SINGLETON_KEY = "__injection_singleton";

export enum Scope { Prototype, Singleton }

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
        const namedTokens = Reflect.getOwnMetadata(TOKEN_KEY, target) || {};
        namedTokens[parameterIndex] = key;
        Reflect.defineMetadata(TOKEN_KEY, namedTokens, target);
    };
}

export class Container {

    public static getInstance = () => Container.instance;
    private static readonly instance = new Container();

    private static getCtorParams<T>(ctor: Constructor<T>) {
        const params: Array<Constructor<T>> = Reflect.getOwnMetadata("design:paramtypes", ctor) || [];
        const injectionTokens: TokenRegistry<T> = Reflect.getOwnMetadata(TOKEN_KEY, ctor) || {};
        Object.keys(injectionTokens).forEach((idx) => params[+idx] = injectionTokens[idx]);
        return params;
    }

    private readonly dependencies = new Map<InjectionToken<any>, Constructor<Provider<any | PromiseLike<any>>>>();
    private readonly cache = new Map<InjectionToken<any>, any>();

    public register<T>(type: Constructor<T>, scope: Scope) {
        const provide = () => this.createInstance(type);
        const providerCtor = class implements Provider<T> {
            public provide = provide;
        };
        this.registerProvider(type, providerCtor, scope);
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
        Reflect.defineMetadata(SINGLETON_KEY, scope === Scope.Singleton, providerCtor);
        this.dependencies.set(token, providerCtor);
    }

    public resolve<T>(token: InjectionToken<T>): T {
        const providerCtor = this.dependencies.get(token);
        if (!providerCtor) {
            const tokenName = typeof token === "string" ? token : token.name;
            throw new Error(`Error resolving token [token=${tokenName}]`);
        }
        const isSingleton = Reflect.getOwnMetadata(SINGLETON_KEY, providerCtor) || false;

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
