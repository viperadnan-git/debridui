import { AccountType } from "../schemas";
import AllDebridClient from "./alldebrid";

export { default as AllDebridClient } from "./alldebrid";

export function getClient({ type }: { type: AccountType | string }) {
    switch (type as AccountType) {
        case AccountType.ALLDEBRID:
            return AllDebridClient;
    }
}
