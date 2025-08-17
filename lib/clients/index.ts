import { AccountType } from "../schemas";
import { User } from "../types";
import AllDebridClient from "./alldebrid";

export { default as AllDebridClient } from "./alldebrid";

export function getClient({ type }: { type: AccountType | string }) {
    switch (type as AccountType) {
        case AccountType.ALLDEBRID:
            return AllDebridClient;
    }
}

export function getClientInstance(user: User) {
    const ClientClass = getClient({ type: user.type });
    return new ClientClass(user);
}