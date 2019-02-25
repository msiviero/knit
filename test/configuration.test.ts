import { config, configuration, env } from "../src/configuration";
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

    it("should inject environment variables", () => {

        process.env.BLA_BLA = "bla_bla";

        @injectable()
        class ConfigurableClass {
            constructor(
                @config("AppConfig:myname") public readonly myname: string,
                @config("AppConfig:fruit") public readonly fruit: string,
                @env("BLA_BLA") public readonly envValue: string,
                @env("NON_EXISTENT_BLA_BLA", "bla_bla2") public readonly envValueWithDefault: string,
                @env("NON_EXISTENT_BLA_BLA2") public readonly envValueWithoutDefault: string,
            ) { }
        }

        const instance = Container.getInstance().resolve(ConfigurableClass);

        expect(instance.myname).toEqual("deps_blabla");
        expect(instance.fruit).toEqual("banana");
        expect(instance.envValue).toEqual("bla_bla");
        expect(instance.envValueWithDefault).toEqual("bla_bla2");
        expect(instance.envValueWithoutDefault).toEqual("");

        process.env.BLA_BLA = undefined;
    });
});
