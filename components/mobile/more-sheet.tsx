"use client";

import { ChevronRight, HelpCircle, Link2, LogOut, type LucideIcon, Moon, Puzzle, Sun, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type Item = { label: string; href: string; icon: LucideIcon; description?: string };

const PRIMARY: Item[] = [
    { label: "Links", href: "/links", icon: Link2, description: "Unrestrict & manage links" },
    { label: "Addons", href: "/addons", icon: Puzzle, description: "Browse & install addons" },
    { label: "Accounts", href: "/accounts", icon: UsersIcon, description: "Manage debrid accounts" },
];

const SECONDARY: Item[] = [{ label: "Help", href: "/help", icon: HelpCircle }];

export function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const { theme, setTheme } = useTheme();
    const { logout, isLoggingOut } = useAuth();
    const [confirmLogout, setConfirmLogout] = useState(false);

    const close = () => onOpenChange(false);
    const isDark = theme === "dark";

    return (
        <>
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="rounded-t-sm border-border/60 max-h-[85vh] data-[vaul-drawer-direction=bottom]:rounded-t-sm">
                    <DrawerHeader className="px-5 pt-2 pb-4 text-left! md:text-left">
                        <DrawerTitle className="text-xs tracking-widest uppercase text-muted-foreground font-light text-left">
                            More
                        </DrawerTitle>
                        <DrawerDescription className="sr-only">Additional navigation and settings</DrawerDescription>
                    </DrawerHeader>

                    <div className="overflow-y-auto pb-[max(env(safe-area-inset-bottom),1rem)]">
                        <ul className="px-2">
                            {PRIMARY.map((item) => (
                                <MoreRow key={item.href} item={item} onNavigate={close} />
                            ))}
                        </ul>

                        <div className="my-2 mx-5 h-px bg-border/50" />

                        <ul className="px-2">
                            {SECONDARY.map((item) => (
                                <MoreRow key={item.href} item={item} onNavigate={close} />
                            ))}

                            <li>
                                <button
                                    type="button"
                                    onClick={() => setTheme(isDark ? "light" : "dark")}
                                    className="w-full flex items-center gap-4 px-3 py-3 rounded-sm cursor-pointer hover:bg-muted/40 active:bg-muted/50 transition-colors">
                                    <span className="flex size-9 items-center justify-center bg-muted/40 rounded-sm shrink-0">
                                        {isDark ? (
                                            <Sun className="size-4" strokeWidth={1.5} />
                                        ) : (
                                            <Moon className="size-4" strokeWidth={1.5} />
                                        )}
                                    </span>
                                    <span className="flex-1 text-left">
                                        <span className="block text-sm font-light">Appearance</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {isDark ? "Dark" : "Light"} theme
                                        </span>
                                    </span>
                                    <span className="text-xs tracking-widest uppercase text-muted-foreground">
                                        {isDark ? "Light" : "Dark"}
                                    </span>
                                </button>
                            </li>

                            <li>
                                <button
                                    type="button"
                                    disabled={isLoggingOut}
                                    onClick={() => {
                                        close();
                                        setConfirmLogout(true);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-3 py-3 rounded-sm cursor-pointer transition-colors",
                                        "hover:bg-destructive/10 active:bg-destructive/15 text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                                    )}>
                                    <span className="flex size-9 items-center justify-center bg-destructive/10 rounded-sm shrink-0">
                                        <LogOut className="size-4" strokeWidth={1.5} />
                                    </span>
                                    <span className="flex-1 text-left text-sm font-light">
                                        {isLoggingOut ? "Logging out…" : "Log out"}
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </DrawerContent>
            </Drawer>

            <ConfirmDialog
                open={confirmLogout}
                onOpenChange={setConfirmLogout}
                title="Log out"
                description="Are you sure you want to log out? You will need to sign in again to access your account."
                confirmText="Log out"
                cancelText="Cancel"
                onConfirm={() => {
                    setConfirmLogout(false);
                    logout();
                }}
                variant="destructive"
            />
        </>
    );
}

function MoreRow({ item, onNavigate }: { item: Item; onNavigate: () => void }) {
    const Icon = item.icon;
    return (
        <li>
            <Link
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-4 px-3 py-3 rounded-sm hover:bg-muted/40 active:bg-muted/50 transition-colors">
                <span className="flex size-9 items-center justify-center bg-muted/40 rounded-sm shrink-0">
                    <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-light truncate">{item.label}</span>
                    {item.description && (
                        <span className="block text-xs text-muted-foreground truncate">{item.description}</span>
                    )}
                </span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </Link>
        </li>
    );
}
