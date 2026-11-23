/**
 * Same-site path from `?callbackUrl=`, or null.
 * Rejects absolute and protocol-relative URLs (`//`, `/\`) so it can't be used as an open redirect.
 */
export function getCallbackUrl(searchParams: { get(name: string): string | null }): string | null {
    const url = searchParams.get("callbackUrl");
    return url?.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\") ? url : null;
}
