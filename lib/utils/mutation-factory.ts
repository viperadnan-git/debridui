import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

interface ToastMessages<TData> {
    loading?: string;
    success?: string | ((result: TData) => string);
    error?: string;
}

/**
 * Hook for mutations with automatic toast notifications
 *
 * Features:
 * - Optional toast messages (omit for silent operations)
 * - Integrates with custom onSuccess/onError callbacks
 * - All messages are optional for maximum flexibility
 */
export function useToastMutation<TData = unknown, TVariables = void, TContext = unknown>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    messages?: ToastMessages<TData>,
    options?: Omit<UseMutationOptions<TData, Error, TVariables, TContext>, "mutationFn">
) {
    return useMutation<TData, Error, TVariables, TContext>({
        mutationFn: async (variables) => {
            const toastId = messages?.loading ? toast.loading(messages.loading) : undefined;
            try {
                const result = await mutationFn(variables);

                // Show success toast if message provided
                const successMsg = messages?.success
                    ? typeof messages.success === "function"
                        ? messages.success(result)
                        : messages.success
                    : undefined;

                if (successMsg) {
                    if (toastId) {
                        toast.success(successMsg, { id: toastId });
                    } else {
                        toast.success(successMsg);
                    }
                } else if (toastId) {
                    // Dismiss loading toast if no success message
                    toast.dismiss(toastId);
                }

                return result;
            } catch (error) {
                // Show error toast if message provided
                if (messages?.error) {
                    const errorMsg = error instanceof Error ? error.message : "Unknown error";
                    const fullErrorMsg = `${messages.error}: ${errorMsg}`;
                    if (toastId) {
                        toast.error(fullErrorMsg, { id: toastId });
                    } else {
                        toast.error(fullErrorMsg);
                    }
                } else if (toastId) {
                    // Dismiss loading toast if no error message
                    toast.dismiss(toastId);
                }

                throw error;
            }
        },
        ...options,
    });
}
