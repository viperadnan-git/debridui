import { AccountType } from "../schemas";
import { User } from "../types";
import RealDebridClient from "./realdebrid";
import TorBoxClient from "./torbox";
import AllDebridClient from "./alldebrid";
import PremiumizeClient from "./premiumize";

export { default as RealDebridClient } from "./realdebrid";
export { default as TorBoxClient } from "./torbox";
export { default as AllDebridClient } from "./alldebrid";
export { default as PremiumizeClient } from "./premiumize";
export type DebridClient =
    | InstanceType<typeof RealDebridClient>
    | InstanceType<typeof TorBoxClient>
    | InstanceType<typeof AllDebridClient>
    | InstanceType<typeof PremiumizeClient>;

export function getClient({ type }: { type: AccountType | string }) {
    switch (type as AccountType) {
        case AccountType.REALDEBRID:
            return RealDebridClient;
        case AccountType.TORBOX:
            return TorBoxClient;
        case AccountType.ALLDEBRID:
            return AllDebridClient;
        case AccountType.PREMIUMIZE:
            return PremiumizeClient;
        default:
            throw new Error(`Unsupported account type: ${type}`);
    }
}

export function getClientInstance(user: User) {
    const ClientClass = getClient({ type: user.type });
    return new ClientClass(user);
}
