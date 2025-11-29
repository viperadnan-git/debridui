import { toast } from "sonner";

/**
 * Lightweight error message extraction
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "An unexpected error occurred";
}

/**
 * Show error toast with optional fallback
 */
export function handleError(error: unknown, fallback?: string): void {
    toast.error(fallback || getErrorMessage(error));
}
