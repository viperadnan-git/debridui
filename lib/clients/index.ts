import { AccountType } from "../schemas";
import { User } from "../types";
import AllDebridClient from "./alldebrid";
import TorBoxClient from "./torbox";
import RealDebridClient from "./realdebrid";

export { default as AllDebridClient } from "./alldebrid";
export { default as TorBoxClient } from "./torbox";
export { default as RealDebridClient } from "./realdebrid";
export type DebridClient =
    | InstanceType<typeof AllDebridClient>
    | InstanceType<typeof TorBoxClient>
    | InstanceType<typeof RealDebridClient>;

export function getClient({ type }: { type: AccountType | string }) {
    switch (type as AccountType) {
        case AccountType.ALLDEBRID:
            return AllDebridClient;
        case AccountType.TORBOX:
            return TorBoxClient;
        case AccountType.REALDEBRID:
            return RealDebridClient;
        default:
            throw new Error(`Unsupported account type: ${type}`);
    }
}

export function getClientInstance(user: User) {
    const ClientClass = getClient({ type: user.type });
    return new ClientClass(user);
}
