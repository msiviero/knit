import { Container, inject, injectable, provider, Scope } from "../src/dependency-injection";

class AClass { public readonly name = "aclass"; }

@provider(AClass)
export class AClassProvider {
    public provide = () => new AClass();
}

@provider<string>("token:b")
export class BProvider {
    public provide = () => "b";
}

@provider<string>("token:rand")
export class SingletonProvider {
    public provide = () => Math.random().toString(36).substring(10);
}

@provider<string>("token:rand-proto", Scope.Prototype)
export class PrototypeProvider {
    public provide = () => Math.random().toString(36).substring(10);
}

@provider<string>("token:c")
export class CProvider {

    constructor(
        private readonly aClass: AClass,
        @inject("token:b") private readonly b: string,
    ) { }

    public provide = () => this.aClass.name + "_c_" + this.b;
}

describe("Providers", () => {

    it("should be able to provide objects instances", () => {
        const instance = Container.getInstance().resolve(AClass);
        expect(instance).toBeDefined();
    });

    it("should be able to provide iterface implementations", () => {
        const instance = Container.getInstance().resolve<string>("token:b");
        expect(instance).toEqual("b");
    });

    it("should have their dependencies injected", () => {
        const instance = Container.getInstance().resolve<string>("token:c");
        expect(instance).toEqual("aclass_c_b");
    });

    it("should reuse the same instance when marked as singleton", () => {
        const instance = Container.getInstance().resolve<string>("token:rand");
        const instance2 = Container.getInstance().resolve<string>("token:rand");
        const instance3 = Container.getInstance().resolve<string>("token:rand");

        expect(instance).toEqual(instance2);
        expect(instance).toEqual(instance3);
    });

    it("should not reuse the same instance when marked as prototype", () => {
        const instance = Container.getInstance().resolve<string>("token:rand-proto");
        const instance2 = Container.getInstance().resolve<string>("token:rand-proto");
        const instance3 = Container.getInstance().resolve<string>("token:rand-proto");

        expect(instance).not.toEqual(instance2);
        expect(instance).not.toEqual(instance3);
        expect(instance2).not.toEqual(instance3);
    });
});

describe("Decorated classes", () => {

    it("should have their dependencies injected", () => {

        @injectable()
        class DClass {
            constructor(
                @inject("token:b") public readonly b: string,
                public readonly aClass: AClass,
            ) { }
        }

        const instance = Container.getInstance().resolve(DClass);
        expect(instance.aClass.name).toEqual("aclass");
        expect(instance.b).toEqual("b");
    });

    it("should reuse the same instance when marked as singleton", () => {

        @injectable()
        class RandClass {
            public readonly id = Math.random().toString(36).substring(10);
        }

        const instance = Container.getInstance().resolve(RandClass);
        const instance2 = Container.getInstance().resolve(RandClass);
        const instance3 = Container.getInstance().resolve(RandClass);

        expect(instance.id).toEqual(instance2.id);
        expect(instance.id).toEqual(instance3.id);
    });

    it("should not reuse the same instance when marked as prototype", () => {

        @injectable(Scope.Prototype)
        class RandProtoClass {
            public readonly id = Math.random().toString(36).substring(10);
        }

        const instance = Container.getInstance().resolve(RandProtoClass);
        const instance2 = Container.getInstance().resolve(RandProtoClass);
        const instance3 = Container.getInstance().resolve(RandProtoClass);

        expect(instance.id).not.toEqual(instance2.id);
        expect(instance.id).not.toEqual(instance3.id);
        expect(instance2.id).not.toEqual(instance3.id);
    });
});

