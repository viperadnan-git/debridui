"use client";

import { GalleryVerticalEnd, Loader2 } from "lucide-react";

import { cn, formatAccountType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/lib/stores/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AccountType, addUserSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { toast } from "sonner";
import { handleError } from "@/lib/utils/error-handling";
import { AllDebridClient, TorBoxClient, getClient } from "@/lib/clients";
import Link from "next/link";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "./ui/select";
import { useRouter } from "@bprogress/next/app";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useLoadingState } from "@/hooks/use-loading-state";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const { addUser, currentUser } = useUserStore(
        useShallow((state) => ({
            addUser: state.addUser,
            currentUser: state.currentUser,
        }))
    );
    const router = useRouter();
    const { isLoading, setLoading } = useLoadingState<"alldebrid" | "torbox">();

    useEffect(() => {
        if (currentUser) {
            router.push("/dashboard");
        }
    }, [currentUser, router]);

    const form = useForm<z.infer<typeof addUserSchema>>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            apiKey: "",
            type: undefined,
        },
    });

    async function onSubmit(values: z.infer<typeof addUserSchema>) {
        try {
            const user = await getClient({ type: values.type }).getUser(values.apiKey);
            addUser(user);
            toast.success(`Logged in as ${user.username} (${user.type})`);
        } catch (error) {
            handleError(error);
        }
    }

    async function handleTorBoxLogin() {
        setLoading("torbox", true);
        try {
            const { redirect_url } = await TorBoxClient.getAuthPin();
            // For TorBox, direct the user to get their API key
            window.open(redirect_url, "_blank", "noreferrer");

            // Show a toast message instructing the user what to do
            toast.info("Please copy your TorBox API key and paste it in the form above");
        } catch (error) {
            handleError(error);
        } finally {
            setLoading("torbox", false);
        }
    }

    async function handleAllDebridLogin() {
        setLoading("alldebrid", true);
        try {
            const { pin, check, redirect_url } = await AllDebridClient.getAuthPin();
            window.open(redirect_url, "_blank", "noreferrer");

            const { success, apiKey } = await AllDebridClient.validateAuthPin(pin, check);

            if (success) {
                const user = await getClient({
                    type: AccountType.ALLDEBRID,
                }).getUser(apiKey!);
                addUser(user);
                toast.success(`Logged in as ${user.username} (${user.type})`);
            } else {
                toast.error("Failed to login with AllDebrid");
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading("alldebrid", false);
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
                                disabled={
                                    form.formState.isSubmitting ||
                                    !form.formState.isValid ||
                                    isLoading("alldebrid") ||
                                    isLoading("torbox")
                                }>
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
                                disabled={isLoading("alldebrid") || isLoading("torbox")}>
                                {isLoading("alldebrid") ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <>
                                        Continue with <span className="font-bold">AllDebrid</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full"
                                onClick={handleTorBoxLogin}
                                disabled={isLoading("alldebrid") || isLoading("torbox")}>
                                {isLoading("torbox") ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <>
                                        Continue with <span className="font-bold">TorBox</span>
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
