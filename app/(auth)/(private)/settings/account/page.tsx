"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { setPassword } from "@/lib/actions/user";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { User, Shield, Monitor, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow, format } from "date-fns";

const AUTH_ACCOUNTS_KEY = ["auth-accounts"];
const USER_SESSIONS_KEY = ["user-sessions"];

const passwordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

const passwordSetSchema = z
    .object({
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function AccountPage() {
    const queryClient = useQueryClient();

    // Get current session/user
    const { data: session } = authClient.useSession();

    // Get user initials for avatar fallback
    const userInitials =
        session?.user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "U";

    // Get avatar URL - use custom image or undefined (falls back to initials)
    const avatarUrl = session?.user?.image || undefined;

    // Check if user has password
    const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
        queryKey: AUTH_ACCOUNTS_KEY,
        queryFn: async () => {
            const response = await authClient.listAccounts();
            if (response.error) {
                throw new Error(response.error.message || "Failed to fetch accounts");
            }
            return response.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const hasPassword = accounts.some((account) => account.providerId === "credential");

    // List sessions
    const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
        queryKey: USER_SESSIONS_KEY,
        queryFn: async () => {
            const response = await authClient.listSessions();
            if (response.error) {
                throw new Error(response.error.message || "Failed to fetch sessions");
            }
            return response.data || [];
        },
        staleTime: 1 * 60 * 1000,
    });

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        values: {
            name: session?.user?.name || "",
            image: session?.user?.image || "",
        },
    });

    const passwordChangeForm = useForm<z.infer<typeof passwordChangeSchema>>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const passwordSetForm = useForm<z.infer<typeof passwordSetSchema>>({
        resolver: zodResolver(passwordSetSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (values: z.infer<typeof profileSchema>) => {
            const { error } = await authClient.updateUser({
                name: values.name,
                image: values.image || null,
            });
            if (error) {
                throw new Error(error.message || "Failed to update profile");
            }
        },
        onSuccess: () => {
            toast.success("Profile updated successfully");
        },
        onError: (error: Error) => {
            toast.error(`Failed to update profile: ${error.message}`);
        },
    });

    // Revoke session mutation
    const revokeSessionMutation = useMutation({
        mutationFn: async (token: string) => {
            const { error } = await authClient.revokeSession({ token });
            if (error) {
                throw new Error(error.message || "Failed to revoke session");
            }
        },
        onSuccess: () => {
            toast.success("Session revoked successfully", {
                description: "Note: The session may still have access until cookies expire",
            });
            queryClient.invalidateQueries({ queryKey: USER_SESSIONS_KEY });
        },
        onError: (error: Error) => {
            toast.error(`Failed to revoke session: ${error.message}`);
        },
    });

    // Revoke other sessions mutation
    const revokeOtherSessionsMutation = useMutation({
        mutationFn: async () => {
            const { error } = await authClient.revokeOtherSessions();
            if (error) {
                throw new Error(error.message || "Failed to revoke sessions");
            }
        },
        onSuccess: () => {
            toast.success("All other sessions revoked successfully");
            queryClient.invalidateQueries({ queryKey: USER_SESSIONS_KEY });
        },
        onError: (error: Error) => {
            toast.error(`Failed to revoke sessions: ${error.message}`);
        },
    });

    const handleUpdateProfile = async (values: z.infer<typeof profileSchema>) => {
        await updateProfileMutation.mutateAsync(values);
    };

    const handleChangePassword = async (values: z.infer<typeof passwordChangeSchema>) => {
        const toastId = toast.loading("Changing password...");

        const { error } = await authClient.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            revokeOtherSessions: true,
        });

        if (error) {
            toast.error(`Failed to change password: ${error.message}`, { id: toastId });
        } else {
            toast.success("Password changed successfully", { id: toastId });
            passwordChangeForm.reset();
        }
    };

    const handleSetPassword = async (values: z.infer<typeof passwordSetSchema>) => {
        const toastId = toast.loading("Setting password...");

        const result = await setPassword(values.newPassword);

        if (!result.success) {
            toast.error(`Failed to set password: ${result.error}`, { id: toastId });
        } else {
            toast.success("Password set successfully", { id: toastId });
            passwordSetForm.reset();
            queryClient.invalidateQueries({ queryKey: AUTH_ACCOUNTS_KEY });
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <PageHeader icon={User} title="Account" description="Manage your profile and security settings" />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Section */}
                <Card className="md:col-span-2 min-w-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>Update your name and profile picture</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-6">
                                {/* Profile Image Preview */}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={avatarUrl} alt={session?.user?.name || "User"} />
                                        <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                                        <p className="text-xs text-muted-foreground">{session?.user?.email || ""}</p>
                                    </div>
                                </div>

                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Your name"
                                                    {...field}
                                                    disabled={updateProfileMutation.isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={profileForm.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Profile Image URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="url"
                                                    placeholder="https://example.com/avatar.jpg"
                                                    {...field}
                                                    disabled={updateProfileMutation.isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>Enter a URL to your profile picture</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Password Section */}
                <Card className="md:col-span-2 min-w-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>
                                    {isLoadingAccounts
                                        ? "Loading..."
                                        : hasPassword
                                          ? "Change your account password"
                                          : "Set a password for your account"}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAccounts ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : hasPassword ? (
                            <Form {...passwordChangeForm}>
                                <form
                                    onSubmit={passwordChangeForm.handleSubmit(handleChangePassword)}
                                    className="space-y-4">
                                    <FormField
                                        control={passwordChangeForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter current password"
                                                        {...field}
                                                        disabled={passwordChangeForm.formState.isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordChangeForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter new password"
                                                        {...field}
                                                        disabled={passwordChangeForm.formState.isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormDescription>Must be at least 8 characters long</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordChangeForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm New Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Confirm new password"
                                                        {...field}
                                                        disabled={passwordChangeForm.formState.isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" disabled={passwordChangeForm.formState.isSubmitting}>
                                        {passwordChangeForm.formState.isSubmitting ? "Changing..." : "Change Password"}
                                    </Button>
                                </form>
                            </Form>
                        ) : (
                            <Form {...passwordSetForm}>
                                <form onSubmit={passwordSetForm.handleSubmit(handleSetPassword)} className="space-y-4">
                                    <FormField
                                        control={passwordSetForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter password"
                                                        {...field}
                                                        disabled={passwordSetForm.formState.isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormDescription>Must be at least 8 characters long</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordSetForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Confirm password"
                                                        {...field}
                                                        disabled={passwordSetForm.formState.isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" disabled={passwordSetForm.formState.isSubmitting}>
                                        {passwordSetForm.formState.isSubmitting ? "Setting..." : "Set Password"}
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>

                {/* Sessions Section */}
                <Card className="md:col-span-2 min-w-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                <Monitor className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Active Sessions</CardTitle>
                                <CardDescription>Manage your active login sessions</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {isLoadingSessions ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">No active sessions found</p>
                            ) : (
                                <>
                                    {sessions.map((sessionItem) => {
                                        const isCurrent = sessionItem.token === session?.session?.token;
                                        return (
                                            <div
                                                key={sessionItem.id}
                                                className="flex flex-col gap-3 rounded-lg border p-4 min-w-0">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium flex items-center gap-2 flex-wrap">
                                                            <span className="truncate">
                                                                {sessionItem.userAgent || "Unknown Device"}
                                                            </span>
                                                            {isCurrent && (
                                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground break-all">
                                                            {sessionItem.ipAddress || "Unknown IP"} •{" "}
                                                            {format(new Date(sessionItem.createdAt), "PPp")}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Expires{" "}
                                                            {formatDistanceToNow(new Date(sessionItem.expiresAt), {
                                                                addSuffix: true,
                                                            })}
                                                        </p>
                                                    </div>
                                                    {!isCurrent && (
                                                        <Button
                                                            onClick={() =>
                                                                revokeSessionMutation.mutate(sessionItem.token)
                                                            }
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={revokeSessionMutation.isPending}
                                                            className="w-full sm:w-auto">
                                                            Revoke
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {sessions.length > 1 && (
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                onClick={() => revokeOtherSessionsMutation.mutate()}
                                                variant="destructive"
                                                size="sm"
                                                disabled={revokeOtherSessionsMutation.isPending}>
                                                {revokeOtherSessionsMutation.isPending
                                                    ? "Revoking..."
                                                    : "Revoke All Other Sessions"}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
