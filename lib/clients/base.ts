import { User } from "@/lib/types";

export default class BaseClient {
    protected readonly user: User;
    constructor(user: User) {
        this.user = user;
    }
}
