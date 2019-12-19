import { config, configuration, converters, env } from "../src/configuration";
import { Container, injectable } from "../src/dependency-injection";

@configuration()
export class DepConfig {
    public myname = "deps";
}

@configuration()
export class AppConfig {

    public myname = this.dep.myname + "_blabla";

    constructor(private readonly dep: DepConfig) { }
    public fruit = () => "banana";
}

describe("Configuration", () => {

    beforeEach(() => {
        process.env.BLA_BLA = "bla_bla";
        process.env.A_LIST = "a,b,c";
    });
    afterEach(() => {
        process.env.BLA_BLA = undefined;
        process.env.A_LIST = undefined;
    });

    it("should inject environment variables", () => {

        @injectable()
        class ConfigurableClass {
            constructor(
                @config("AppConfig:myname") public readonly myname: string,
                @config("AppConfig:fruit") public readonly fruit: string,
                @env("BLA_BLA") public readonly envValue: string,
                @env("NON_EXISTENT_BLA_BLA", "bla_bla2") public readonly envValueWithDefault: string,
                @env("NON_EXISTENT_BLA_BLA2") public readonly envValueWithoutDefault: string,
                @env("A_NUMBER", 10, converters.number) public readonly aNumber: number,
                @env("A_LIST", undefined, converters.number) public readonly aList: string[],
            ) { }
        }

        const instance = Container.getInstance().resolve(ConfigurableClass);

        expect(instance.myname).toEqual("deps_blabla");
        expect(instance.fruit).toEqual("banana");
        expect(instance.envValue).toEqual("bla_bla");
        expect(instance.envValueWithDefault).toEqual("bla_bla2");
        expect(instance.envValueWithoutDefault).toBeUndefined();
        expect(instance.aNumber).toBe(10);
        expect(instance.aList).toEqual(["a", "b", "c"]);
    });
});
