
@injectable()
class Test {
    constructor(
        public readonly test2: Test2, // valid only if class marked with injectable if else return undefined
        @inject() public readonly blabla: string, // custom injected token
    ) { }
}

@config()
class ConfigurationClass {
    public readonly name = process.env.MY_CONFIG || "default"; // this should be injectable as @inject("config:ConfigurationClass.name")
}

class Logger {

}


use pino + fastify?
