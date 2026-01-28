"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { setPassword } from "@/lib/actions/user";
import { PageHeader } from "@/components/page-header";
import { SectionDivider } from "@/components/section-divider";
import { clearAppCache } from "@/lib/utils";
import { parseUserAgent } from "@/lib/utils/media-player";
import { toast } from "sonner";
import { UserCog, AlertTriangle, Monitor, Smartphone, Tablet, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDeleting(true);
        const toastId = toast.loading("Deleting account...");

        const { error } = await authClient.deleteUser({
            password: deletePassword,
            callbackURL: "/",
        });

        if (error) {
            toast.error(`Failed to delete account: ${error.message}`, { id: toastId });
            setIsDeleting(false);
        } else {
            await clearAppCache();
            toast.success("Account deleted", { id: toastId });
        }
    };

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">
            <PageHeader icon={UserCog} title="Account" description="Manage your profile and security settings" />

            {/* Profile Section */}
            <section className="space-y-4">
                <SectionDivider label="Profile" />

                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-6">
                        {/* Profile Image Preview */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 rounded-sm">
                                <AvatarImage src={avatarUrl} alt={session?.user?.name || "User"} />
                                <AvatarFallback className="rounded-sm text-lg">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-light text-lg">{session?.user?.name || "User"}</p>
                                <p className="text-xs text-muted-foreground">{session?.user?.email || ""}</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Name</FormLabel>
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
                                        <FormLabel className="text-xs text-muted-foreground">
                                            Profile Image URL
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="url"
                                                placeholder="https://example.com/avatar.jpg"
                                                {...field}
                                                disabled={updateProfileMutation.isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                        </Button>
                    </form>
                </Form>
            </section>

            {/* Password Section */}
            <section className="space-y-4">
                <SectionDivider label="Password" />

                {isLoadingAccounts ? (
                    <div className="space-y-4 max-w-md">
                        <Skeleton className="h-3 w-48" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        {hasPassword ? "Change your account password" : "Set a password for your account"}
                    </p>
                )}

                {isLoadingAccounts ? null : hasPassword ? (
                    <Form {...passwordChangeForm}>
                        <form
                            onSubmit={passwordChangeForm.handleSubmit(handleChangePassword)}
                            className="space-y-4 max-w-md">
                            <FormField
                                control={passwordChangeForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">
                                            Current Password
                                        </FormLabel>
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
                                        <FormLabel className="text-xs text-muted-foreground">New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter new password"
                                                {...field}
                                                disabled={passwordChangeForm.formState.isSubmitting}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Must be at least 8 characters long
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={passwordChangeForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">
                                            Confirm New Password
                                        </FormLabel>
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
                        <form onSubmit={passwordSetForm.handleSubmit(handleSetPassword)} className="space-y-4 max-w-md">
                            <FormField
                                control={passwordSetForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter password"
                                                {...field}
                                                disabled={passwordSetForm.formState.isSubmitting}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Must be at least 8 characters long
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={passwordSetForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">
                                            Confirm Password
                                        </FormLabel>
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
            </section>

            {/* Sessions Section */}
            <section className="space-y-4">
                <SectionDivider label="Active Sessions" />

                <div className="space-y-3">
                    {isLoadingSessions ? (
                        <>
                            {[1, 2].map((i) => (
                                <div key={i} className="rounded-sm border border-border/50 p-4">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="size-10 rounded-sm shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-56" />
                                        </div>
                                        <Skeleton className="h-8 w-16 shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No active sessions found</p>
                    ) : (
                        <>
                            {sessions.map((sessionItem) => {
                                const isCurrent = sessionItem.token === session?.session?.token;
                                const parsed = parseUserAgent(sessionItem.userAgent);
                                const DeviceIcon =
                                    parsed.device === "Phone"
                                        ? Smartphone
                                        : parsed.device === "Tablet"
                                          ? Tablet
                                          : Monitor;

                                return (
                                    <div
                                        key={sessionItem.id}
                                        className={`rounded-sm border p-3 sm:p-4 transition-colors ${isCurrent ? "border-primary/30 bg-primary/[0.03]" : "border-border/50 hover:border-border"}`}>
                                        {/* Top row: icon + summary + badge + revoke */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex size-9 shrink-0 items-center justify-center rounded-sm ${isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                <DeviceIcon className="size-4" strokeWidth={1.5} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-light truncate text-sm">{parsed.summary}</p>
                                                    {isCurrent && (
                                                        <Badge
                                                            variant="default"
                                                            className="text-[10px] tracking-widest uppercase px-1.5 py-0 shrink-0">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground/50 truncate">
                                                    {sessionItem.userAgent || "Unknown user agent"}
                                                </p>
                                            </div>
                                            {!isCurrent && (
                                                <Button
                                                    onClick={() => revokeSessionMutation.mutate(sessionItem.token)}
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={revokeSessionMutation.isPending}
                                                    className="shrink-0">
                                                    Revoke
                                                </Button>
                                            )}
                                        </div>

                                        {/* Meta row */}
                                        <div className="mt-2 ml-12 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                            {sessionItem.ipAddress && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="size-3 shrink-0" />
                                                    {sessionItem.ipAddress}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="size-3 shrink-0" />
                                                {formatDistanceToNow(new Date(sessionItem.createdAt), {
                                                    addSuffix: true,
                                                })}
                                                <span className="text-border">·</span>
                                                {new Date(sessionItem.createdAt).toLocaleString()}
                                            </span>
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
            </section>

            {/* Delete Account Section */}
            <section className="space-y-4">
                <SectionDivider label="Danger Zone" />

                <div className="rounded-sm border border-destructive/30 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <p className="font-light">Delete Account</p>
                            <p className="text-xs text-muted-foreground">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                        {isLoadingAccounts ? (
                            <Skeleton className="h-9 w-32" />
                        ) : hasPassword ? (
                            <Dialog
                                open={deleteDialogOpen}
                                onOpenChange={(open) => {
                                    setDeleteDialogOpen(open);
                                    if (!open) setDeletePassword("");
                                }}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" className="w-full sm:w-auto">
                                        Delete Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="size-5 text-destructive" />
                                            Delete Account
                                        </DialogTitle>
                                        <DialogDescription>
                                            This action cannot be undone. All your data will be permanently deleted.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                                        <div className="space-y-2">
                                            <label htmlFor="delete-password" className="text-sm">
                                                Enter your password to confirm:
                                            </label>
                                            <Input
                                                id="delete-password"
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                placeholder="Password"
                                                disabled={isDeleting}
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setDeleteDialogOpen(false)}
                                                disabled={isDeleting}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" variant="destructive" disabled={isDeleting}>
                                                {isDeleting ? "Deleting..." : "Delete Account"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Set a password above to enable account deletion
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
