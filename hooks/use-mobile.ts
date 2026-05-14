import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_MAX_BREAKPOINT = 1024;

function useMediaQuery(query: string) {
    const [matches, setMatches] = React.useState<boolean>(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const mql = window.matchMedia(query);
        setMatches(mql.matches);

        const onChange = () => setMatches(mql.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, [query]);

    if (!mounted) return false;
    return matches;
}

export function useIsMobile() {
    return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

export function useIsTablet() {
    return useMediaQuery(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_MAX_BREAKPOINT - 1}px)`);
}
