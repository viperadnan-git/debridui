"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AccountType, accountSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { RealDebridClient, TorBoxClient, AllDebridClient, PremiumizeClient } from "@/lib/clients";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "./ui/select";
import { useAddUserAccount } from "@/hooks/use-user-accounts";
import { SectionDivider } from "@/components/section-divider";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { handleError } from "@/lib/utils/error-handling";
import { formatAccountType } from "@/lib/utils";

export function AddAccountForm() {
    const addAccount = useAddUserAccount();
    const [isLoadingOAuth, setIsLoadingOAuth] = useState<"alldebrid" | "torbox" | "realdebrid" | "premiumize" | null>(
        null
    );
    const isPremiumizeConfigured = useMemo(() => PremiumizeClient.isOAuthConfigured(), []);

    const form = useForm<z.infer<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            apiKey: "",
            type: undefined,
        },
    });

    // AuthProvider handles redirect to /dashboard after account is added
    function onSubmit(values: z.infer<typeof accountSchema>) {
        addAccount.mutate(values, { onSuccess: () => form.reset() });
    }

    /**
     * Generate random state for OAuth CSRF protection
     */
    function generateRandomState(length: number): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        let result = "";
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    }

    async function handleAllDebridLogin() {
        setIsLoadingOAuth("alldebrid");
        try {
            const { pin, check, redirect_url } = await AllDebridClient.getAuthPin();
            window.open(redirect_url, "_blank", "noreferrer");

            const { success, apiKey } = await AllDebridClient.validateAuthPin(pin, check);

            if (success && apiKey) {
                // AuthProvider handles redirect to /dashboard after account is added
                addAccount.mutate({ type: AccountType.ALLDEBRID, apiKey }, { onSuccess: () => form.reset() });
            } else {
                toast.error("Failed to login with AllDebrid");
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoadingOAuth(null);
        }
    }

    async function handleTorBoxLogin() {
        setIsLoadingOAuth("torbox");
        try {
            const { redirect_url } = await TorBoxClient.getAuthPin();
            window.open(redirect_url, "_blank", "noreferrer");
            toast.info("Please copy your TorBox API key and paste it in the form above");
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoadingOAuth(null);
        }
    }

    async function handleRealDebridLogin() {
        setIsLoadingOAuth("realdebrid");
        try {
            const { redirect_url } = await RealDebridClient.getAuthPin();
            window.open(redirect_url, "_blank", "noreferrer");
            toast.info("Please copy your Real-Debrid API token and paste it in the form above");
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoadingOAuth(null);
        }
    }

    async function handlePremiumizeLogin() {
        setIsLoadingOAuth("premiumize");
        try {
            // Generate random state for CSRF protection
            const state = generateRandomState(32);

            // Store state in cookie (will be verified in callback)
            // Using document.cookie to match backend cookie handling
            const stateValue = encodeURIComponent(state);
            document.cookie = `premiumize_oauth_state=${stateValue}; path=/; max-age=600; SameSite=Lax`;

            // Get authorization URL
            const authUrl = PremiumizeClient.getAuthorizationUrl(state);

            // Redirect user to Premiumize authorization endpoint
            window.location.href = authUrl;
        } catch (error) {
            handleError(error);
            setIsLoadingOAuth(null);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Account Type</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an account type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(AccountType).map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {formatAccountType(type)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="apiKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">API Key</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter your API key" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={form.formState.isSubmitting || addAccount.isPending || !!isLoadingOAuth}>
                            {form.formState.isSubmitting || addAccount.isPending ? "Adding account..." : "Add Account"}
                        </Button>

                        <SectionDivider label="Or continue with" />

                        <div className="grid gap-2 grid-cols-1">
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full"
                                onClick={handleRealDebridLogin}
                                disabled={!!isLoadingOAuth || addAccount.isPending}>
                                {isLoadingOAuth === "realdebrid" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    "Real-Debrid"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full"
                                onClick={handleTorBoxLogin}
                                disabled={!!isLoadingOAuth || addAccount.isPending}>
                                {isLoadingOAuth === "torbox" ? <Loader2 className="size-4 animate-spin" /> : "TorBox"}
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full"
                                onClick={handleAllDebridLogin}
                                disabled={!!isLoadingOAuth || addAccount.isPending}>
                                {isLoadingOAuth === "alldebrid" ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    "AllDebrid"
                                )}
                            </Button>
                            {isPremiumizeConfigured && (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full"
                                    onClick={handlePremiumizeLogin}
                                    disabled={!!isLoadingOAuth || addAccount.isPending}>
                                    {isLoadingOAuth === "premiumize" ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Premiumize"
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
