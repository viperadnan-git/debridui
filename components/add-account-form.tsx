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
import { useState } from "react";
import { toast } from "sonner";
import { handleError } from "@/lib/utils/error-handling";
import { formatAccountType } from "@/lib/utils";

export function AddAccountForm() {
    const addAccount = useAddUserAccount();
    const [isLoadingOAuth, setIsLoadingOAuth] = useState<"alldebrid" | "torbox" | "realdebrid" | "premiumize" | null>(
        null
    );
    const [premiumizeDevice, setPremiumizeDevice] = useState<{
        userCode: string;
        deviceCode: string;
        verificationUri: string;
    } | null>(null);

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
            const { pin, check, redirect_url } = await PremiumizeClient.getAuthPin();

            setPremiumizeDevice({
                userCode: pin,
                deviceCode: check,
                verificationUri: redirect_url,
            });

            try {
                toast(`Code: ${pin}`, {
                    action: {
                        label: "Copy",
                        onClick: () => {
                            navigator.clipboard
                                .writeText(pin)
                                .then(() => toast.success("Premiumize device code copied!"))
                                .catch(() => toast.error("Copy failed!"));
                        },
                    },
                });
            } catch (err) {
                toast.info("Device code available below. Please copy it manually.");
                console.error("Clipboard failed:", err);
            }

            // Open verification URL in a new tab so user can paste the code there
            const opened = openNewPage(redirect_url);
            if (!opened) {
                toast.info("Please open the verification URL displayed below in a new tab and paste the code there.");
            }

            // Poll for token (validateAuthPin will poll server-side)
            const { success, apiKey } = await PremiumizeClient.validateAuthPin(pin, check);
            if (success && apiKey) {
                addAccount.mutate(
                    { type: AccountType.PREMIUMIZE, apiKey: `Bearer ${apiKey}` },
                    { onSuccess: () => form.reset() }
                );
                setPremiumizeDevice(null);
            } else {
                toast.error("Failed to retrieve Premiumize token");
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoadingOAuth(null);
        }
    }

    function openNewPage(url: string): boolean {
        try {
            const opened = window.open(url, "_blank");
            if (!opened) {
                return false;
            }
            // Explicitly prevent access to window.opener
            opened.opener = null;

            return true;
        } catch (err) {
            console.error(`Failed opening url ${url} in new page`, err);
            return false;
        }
    }

    function renderPremiumizeDeviceBox() {
        if (!premiumizeDevice) return null;

        return (
            <div className="p-4 bg-muted rounded-md border border-border">
                <div className="mb-2 text-sm">Open this URL in your browser and enter the device code bellow:</div>
                <div className="mb-2">
                    <a href={premiumizeDevice.verificationUri} target="_blank" rel="noreferrer" className="underline">
                        {premiumizeDevice.verificationUri}
                    </a>
                </div>
                <div className="mb-2 text-sm font-medium">Device code:</div>
                <div className="mb-2">
                    <input
                        readOnly
                        value={premiumizeDevice.userCode}
                        className="w-full bg-transparent border rounded px-2 py-1"
                        onFocus={(e) => {
                            const input = e.currentTarget;
                            requestAnimationFrame(() => input.select());
                        }}
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setPremiumizeDevice(null);
                        }}>
                        Dismiss
                    </Button>
                </div>
            </div>
        );
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
                            {renderPremiumizeDeviceBox()}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
