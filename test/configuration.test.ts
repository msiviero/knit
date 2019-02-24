import { config, configuration } from "../src/configuration";
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

        @injectable()
        class ConfigurableClass {
            constructor(
                @config("AppConfig:myname") public readonly myname: string,
                @config("AppConfig:fruit") public readonly fruit: string,
            ) { }
        }

        const instance = Container.getInstance().resolve(ConfigurableClass);

        expect(instance.myname).toEqual("deps_blabla");
        expect(instance.fruit).toEqual("banana");
    });
});
