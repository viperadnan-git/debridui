"use client";

import { GalleryVerticalEnd, Loader2 } from "lucide-react";

import { cn, formatAccountType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/lib/stores/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AccountType, addAccountSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { toast } from "sonner";
import { AllDebridClient, getClient } from "@/lib/clients";
import Link from "next/link";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "./ui/select";
import { useRouter } from "@bprogress/next/app";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const { addAccount, currentUser: activeAccount } = useUserStore(
        useShallow((state) => ({
            addAccount: state.addAccount,
            currentUser: state.currentUser,
        }))
    );
    const router = useRouter();
    const [isAllDebridLoading, setIsAllDebridLoading] = useState(false);

    useEffect(() => {
        if (activeAccount) {
            router.push("/dashboard");
        }
    }, [activeAccount, router]);

    const form = useForm<z.infer<typeof addAccountSchema>>({
        resolver: zodResolver(addAccountSchema),
        defaultValues: {
            apiKey: "",
            type: undefined,
        },
    });

    async function onSubmit(values: z.infer<typeof addAccountSchema>) {
        try {
            const user = await getClient({ type: values.type }).getUser(values.apiKey);
            addAccount(user);
            toast.success(`Logged in as ${user.username} (${user.type})`);
        } catch (error) {
            toast.error((error as Error).message);
        }
    }

    async function handleAllDebridLogin() {
        setIsAllDebridLoading(true);
        try {
            const { pin, check, redirect_url } = await AllDebridClient.getAuthPin();
            window.open(redirect_url, "_blank", "noreferrer");

            const { success, apiKey } = await AllDebridClient.validateAuthPin(pin, check);

            if (success) {
                const user = await getClient({
                    type: AccountType.ALLDEBRID,
                }).getUser(apiKey!);
                addAccount(user);
                toast.success(`Logged in as ${user.username} (${user.type})`);
            } else {
                toast.error("Failed to login with AllDebrid");
            }
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsAllDebridLoading(false);
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <a href="#" className="flex flex-col items-center gap-2 font-medium">
                                <div className="flex size-8 items-center justify-center rounded-md">
                                    <GalleryVerticalEnd className="size-6" />
                                </div>
                                <span className="sr-only">DebridUI</span>
                            </a>
                            <h1 className="text-xl font-bold">Welcome to DebridUI</h1>
                            <div className="text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <Link href="https://alldebrid.com" className="underline underline-offset-4">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div>
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Type</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            </div>
                            <div className="grid gap-3">
                                <FormField
                                    control={form.control}
                                    name="apiKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>API Key</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.formState.isSubmitting || !form.formState.isValid || isAllDebridLoading}>
                                {form.formState.isSubmitting ? "Logging in..." : "Login"}
                            </Button>
                        </div>
                        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                            <span className="bg-background text-muted-foreground relative z-10 px-2">Or</span>
                        </div>
                        <div className="grid gap-4 grid-cols-1">
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full"
                                onClick={handleAllDebridLogin}
                                disabled={isAllDebridLoading}>
                                {isAllDebridLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <>
                                        Continue with <span className="font-bold">AllDebrid</span>
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" type="button" className="w-full" disabled={true}>
                                Continue with <span className="font-bold">RealDebrid</span>
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our{" "}
                <a href="https://github.com/viperadnan-git/debridui/#disclaimer">Terms of Service</a> and{" "}
                <a href="https://github.com/viperadnan-git/debridui/#disclaimer">Privacy Policy</a>.
            </div>
        </div>
    );
}
