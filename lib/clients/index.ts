import { AccountType } from "../schemas";
import { User } from "../types";
import AllDebridClient from "./alldebrid";
import TorBoxClient from "./torbox";

export { default as AllDebridClient } from "./alldebrid";
export { default as TorBoxClient } from "./torbox";
export type DebridClient = InstanceType<typeof AllDebridClient> | InstanceType<typeof TorBoxClient>;

export function getClient({ type }: { type: AccountType | string }) {
    switch (type as AccountType) {
        case AccountType.ALLDEBRID:
            return AllDebridClient;
        case AccountType.TORBOX:
            return TorBoxClient;
        default:
            throw new Error(`Unsupported account type: ${type}`);
    }
}

export function getClientInstance(user: User) {
    const ClientClass = getClient({ type: user.type });
    return new ClientClass(user);
}
