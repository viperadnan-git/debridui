"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignupForm() {
    const router = useRouter();
    const isEmailSignupDisabled = process.env.NEXT_PUBLIC_DISABLE_EMAIL_SIGNUP === "true";

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof signupSchema>) {
        try {
            const { data, error } = await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
            });

            if (error) {
                toast.error(error.message || "Failed to sign up");
                return;
            }

            if (data) {
                toast.success("Account created successfully");
                router.push("/dashboard");
            }
        } catch {
            toast.error("An unexpected error occurred");
        }
    }

    return (
        <div className="bg-background grid grid-rows-[1fr_auto] min-h-svh p-6 md:p-10">
            <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex size-12 items-center justify-center">
                                <Image
                                    src="/icon.svg"
                                    alt="DebridUI"
                                    width={48}
                                    height={48}
                                    className="invert dark:invert-0"
                                />
                            </div>
                            <span className="sr-only">DebridUI</span>
                        </Link>
                        <h1 className="text-xl font-bold">Create an Account</h1>
                        <p className="text-sm text-muted-foreground text-center">Sign up to get started</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                            <GoogleSignInButton mode="signup" callbackURL="/dashboard" />

                            {!isEmailSignupDisabled && (
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <Separator />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">
                                                Or continue with email
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Your name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="name@example.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="Create a password"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? "Creating account..." : "Sign Up"}
                                        </Button>
                                    </div>
                                </>
                            )}
                            <div className="text-center text-sm">
                                Already have an account?{" "}
                                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>

            <footer className="flex items-center justify-center pb-6">
                <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                    By signing up, you acknowledge our{" "}
                    <a
                        href="https://github.com/viperadnan-git/debridui/blob/main/DISCLAIMER.md"
                        target="_blank"
                        rel="noopener noreferrer">
                        disclaimer
                    </a>
                    .
                </div>
            </footer>
        </div>
    );
}
