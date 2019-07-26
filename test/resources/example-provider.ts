import { provider } from "../../src/dependency-injection";

export class User {
    constructor(public readonly name: string) { }
}

@provider(User)
export class ExampleProvider {

    public provide() {
        return new User("name");
    }
}
