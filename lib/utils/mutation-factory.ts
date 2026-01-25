import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

interface ToastMessages<TData> {
    loading: string;
    success: string | ((result: TData) => string);
    error: string;
}

/**
 * Hook for mutations with automatic toast notifications
 */
export function useToastMutation<TData = unknown, TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    messages: ToastMessages<TData>,
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
) {
    return useMutation<TData, Error, TVariables>({
        mutationFn: async (variables) => {
            const toastId = toast.loading(messages.loading);
            try {
                const result = await mutationFn(variables);
                const successMsg = typeof messages.success === "function" ? messages.success(result) : messages.success;
                toast.success(successMsg, { id: toastId });
                return result;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : "Unknown error";
                toast.error(`${messages.error}: ${errorMsg}`, { id: toastId });
                throw error;
            }
        },
        ...options,
    });
}
