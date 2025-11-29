import { useState, useCallback } from "react";

/**
 * Lightweight hook for managing loading states
 * Reduces memory overhead by using a single state object
 */
export function useLoadingState<K extends string = string>(initialStates?: Record<K, boolean>) {
    const [states, setStates] = useState<Record<K, boolean>>(initialStates || ({} as Record<K, boolean>));

    const setLoading = useCallback((key: K, value: boolean) => {
        setStates((prev) => ({ ...prev, [key]: value }));
    }, []);

    const isLoading = useCallback((key: K) => Boolean(states[key]), [states]);

    const reset = useCallback(() => {
        setStates({} as Record<K, boolean>);
    }, []);

    return { isLoading, setLoading, reset, states };
}

/**
 * Simple loading state for single boolean
 */
export function useSimpleLoading(initial = false) {
    const [loading, setLoading] = useState(initial);

    const startLoading = useCallback(() => setLoading(true), []);
    const stopLoading = useCallback(() => setLoading(false), []);

    return { loading, setLoading, startLoading, stopLoading };
}
