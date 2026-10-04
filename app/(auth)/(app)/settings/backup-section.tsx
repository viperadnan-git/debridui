"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    ArchiveRestore,
    Download,
    FileJson,
    Key,
    Loader2,
    Lock,
    type LucideIcon,
    Puzzle,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Upload,
    UsersIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { SectionDivider } from "@/components/section-divider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { USER_ADDONS_KEY } from "@/hooks/use-addons";
import { USER_ACCOUNTS_KEY } from "@/hooks/use-user-accounts";
import { hydrateSettingsFromServer, USER_SETTINGS_KEY } from "@/hooks/use-user-settings";
import { getUserAddons } from "@/lib/actions/addons";
import { restoreBackup } from "@/lib/actions/backup";
import { getUserSettings } from "@/lib/actions/settings";
import { getUserAccounts } from "@/lib/actions/user-accounts";
import {
    BACKUP_SECTIONS,
    type BackupData,
    BackupPasswordError,
    type BackupSection as BackupSectionKey,
    backupSections,
    createBackup,
    type ParsedBackup,
    parseBackup,
} from "@/lib/backup";
import type { AccountType } from "@/lib/schemas";
import { normalizeSettings, useSettingsStore } from "@/lib/stores/settings";
import { cn, formatRelativeTime } from "@/lib/utils";
import { downloadBlob } from "@/lib/utils/file";
import { useToastMutation } from "@/lib/utils/mutation-factory";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const SECTIONS: Record<
    BackupSectionKey,
    { label: string; icon: LucideIcon; sensitive?: boolean; summary: (data: BackupData) => string | null }
> = {
    preferences: {
        label: "Preferences",
        icon: Sliders,
        summary: ({ preferences: p }) =>
            p?.theme || Object.keys(p?.settings ?? {}).length ? "Theme, player, streaming and cache" : null,
    },
    addons: {
        label: "Addons",
        icon: Puzzle,
        sensitive: true,
        summary: ({ addons }) => (addons?.length ? plural(addons.length, "addon") : null),
    },
    accounts: {
        label: "Debrid accounts",
        icon: UsersIcon,
        sensitive: true,
        summary: ({ accounts }) => (accounts?.length ? plural(accounts.length, "account") : null),
    },
    integrations: {
        label: "API keys",
        icon: Key,
        sensitive: true,
        summary: ({ integrations }) => (integrations?.tmdb_api_key ? "TMDB" : null),
    },
};

const MODES = {
    export: {
        title: "Export backup",
        description: "Choose what to include in the file.",
        action: "Download",
        icon: Download,
    },
    unlock: {
        title: "Unlock backup",
        description: "Enter the password used when this backup was exported.",
        action: "Unlock",
        icon: Lock,
    },
    restore: {
        title: "Restore backup",
        description: "Choose what to restore.",
        action: "Restore",
        icon: ArchiveRestore,
    },
};

const MAX_FILE_SIZE = 1024 * 1024;

const pick = (data: BackupData, keys: Set<BackupSectionKey>): BackupData =>
    Object.fromEntries(Object.entries(data).filter(([key]) => keys.has(key as BackupSectionKey)));

function BackupFile({
    fileName,
    encrypted,
    exportedAt,
}: {
    fileName: string;
    encrypted: boolean;
    exportedAt?: string;
}) {
    const date = exportedAt ? new Date(exportedAt) : undefined;
    return (
        <div className="flex items-center gap-3 rounded-sm border border-border/50 bg-muted/30 p-3">
            <FileJson className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={fileName}>
                    {fileName}
                </p>
                {(encrypted || date) && (
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                        {encrypted && (
                            <span className="inline-flex items-center gap-1">
                                <Lock className="size-3 -translate-y-px" />
                                Encrypted
                            </span>
                        )}
                        {encrypted && date && <span className="text-border">·</span>}
                        {date && <span title={format(date, "PPpp")}>Exported {formatRelativeTime(date)}</span>}
                    </p>
                )}
            </div>
        </div>
    );
}

type DialogState =
    | { mode: "export"; data: BackupData }
    | { mode: "restore"; backup: ParsedBackup; fileName: string }
    | { mode: "unlock"; text: string; fileName: string };

export function BackupSection() {
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    const setMultiple = useSettingsStore((s) => s.setMultiple);
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [selected, setSelected] = useState<Set<BackupSectionKey>>(new Set());
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string>();

    const openDialog = (state: DialogState) => {
        if (state.mode !== "unlock") {
            const data = state.mode === "export" ? state.data : state.backup.data;
            setSelected(new Set(BACKUP_SECTIONS.filter((key) => SECTIONS[key].summary(data))));
        }
        setPassword("");
        setPasswordError(undefined);
        setDialog(state);
    };

    const prepareExport = useToastMutation(
        async (): Promise<BackupData> => {
            const [addons, accounts, serverSettings] = await Promise.all([
                queryClient.ensureQueryData({ queryKey: USER_ADDONS_KEY, queryFn: getUserAddons }),
                queryClient.ensureQueryData({ queryKey: USER_ACCOUNTS_KEY, queryFn: getUserAccounts }),
                queryClient.ensureQueryData({ queryKey: USER_SETTINGS_KEY, queryFn: getUserSettings }),
            ]);
            const { tmdbApiKey: _, ...settings } = useSettingsStore.getState().settings;
            return {
                preferences: { theme: backupSections.preferences.shape.theme.parse(theme), settings },
                addons: addons.map(({ name, url, enabled }) => ({ name, url, enabled })),
                accounts: accounts.map(({ type, name, apiKey }) => ({ type: type as AccountType, name, apiKey })),
                integrations: serverSettings ?? {},
            };
        },
        { error: "Failed to prepare backup" },
        { onSuccess: (data) => openDialog({ mode: "export", data }) }
    );

    const restore = useToastMutation(
        async (data: BackupData) => {
            const { preferences, ...server } = data;
            const result = Object.keys(server).length
                ? await restoreBackup(server)
                : { addedAddons: 0, addedAccounts: 0 };
            // After the server call, so a failed restore changes nothing
            if (preferences) {
                const { tmdbApiKey: _, ...settings } = normalizeSettings(
                    preferences.settings,
                    useSettingsStore.getState().settings
                );
                setMultiple(settings);
                if (preferences.theme) setTheme(preferences.theme);
            }
            if (data.integrations) hydrateSettingsFromServer(data.integrations);
            return result;
        },
        { error: "Failed to restore backup" },
        {
            onSuccess: ({ addedAddons, addedAccounts }, data) => {
                if (data.addons) queryClient.invalidateQueries({ queryKey: USER_ADDONS_KEY });
                if (data.accounts) queryClient.invalidateQueries({ queryKey: USER_ACCOUNTS_KEY });
                if (data.integrations) queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEY });
                const added = [
                    addedAddons && plural(addedAddons, "addon"),
                    addedAccounts && plural(addedAccounts, "account"),
                ].filter(Boolean);
                toast.success("Backup restored", {
                    description: added.length ? `Added ${added.join(" and ")}` : undefined,
                });
                setDialog(null);
            },
        }
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        accept: { "application/json": [".json"] },
        maxFiles: 1,
        maxSize: MAX_FILE_SIZE,
        noClick: true,
        noKeyboard: true,
        onDropRejected: ([rejection]) =>
            toast.error(
                rejection?.errors[0]?.code === "file-too-large"
                    ? "Backup file is larger than 1 MB"
                    : "Choose a .json backup file"
            ),
        onDropAccepted: async ([file]) => {
            let text = "";
            try {
                text = await file.text();
                openDialog({ mode: "restore", backup: await parseBackup(text), fileName: file.name });
            } catch (error) {
                if (error instanceof BackupPasswordError) openDialog({ mode: "unlock", text, fileName: file.name });
                else toast.error("Can't read backup", { description: (error as Error).message });
            }
        },
    });

    const unlock = useToastMutation(
        ({ text }: Extract<DialogState, { mode: "unlock" }>) => parseBackup(text, password),
        undefined,
        {
            onSuccess: (backup, { fileName }) => openDialog({ mode: "restore", backup, fileName }),
            onError: (error) => {
                if (error instanceof BackupPasswordError) return setPasswordError(error.message);
                toast.error("Can't read backup", { description: error.message });
                setDialog(null);
            },
        }
    );

    const download = useToastMutation(
        async (data: BackupData) => {
            const backup = await createBackup(pick(data, selected), password || undefined);
            downloadBlob(
                new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
                `debridui-backup-${new Date().toISOString().slice(0, 10)}.json`
            );
        },
        { success: "Backup downloaded", error: "Failed to create backup" },
        { onSuccess: () => setDialog(null) }
    );

    const busy = restore.isPending || unlock.isPending || download.isPending;
    const data = dialog?.mode === "export" ? dialog.data : dialog?.mode === "restore" ? dialog.backup.data : undefined;
    const hasSensitive = [...selected].some((key) => SECTIONS[key].sensitive);
    const mode = dialog && MODES[dialog.mode];
    const ActionIcon = busy ? Loader2 : (mode?.icon ?? Download);
    const canSubmit = !busy && (dialog?.mode === "unlock" ? !!password : selected.size > 0);

    const submit = () => {
        if (!canSubmit) return;
        if (dialog?.mode === "export") download.mutate(dialog.data);
        else if (dialog?.mode === "restore") restore.mutate(pick(dialog.backup.data, selected));
        else if (dialog?.mode === "unlock") {
            setPasswordError(undefined);
            unlock.mutate(dialog);
        }
    };

    return (
        <section className="space-y-4">
            <SectionDivider label="Backup" />

            <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-sm border border-border/50 p-3">
                    <div>
                        <p className="text-sm">Export</p>
                        <p className="text-xs text-muted-foreground">
                            Save your preferences, addons and accounts to a file
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => prepareExport.mutate()} disabled={prepareExport.isPending}>
                        {prepareExport.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Download className="size-4" />
                        )}
                        Export
                    </Button>
                </div>

                <div
                    {...getRootProps()}
                    className={cn(
                        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-sm border border-border/50 p-3 transition-colors duration-200",
                        isDragActive && "border-dashed border-primary bg-primary/5"
                    )}>
                    <input {...getInputProps()} />
                    <div>
                        <p className="text-sm">Restore</p>
                        <p className="text-xs text-muted-foreground">
                            {isDragActive ? "Drop to load this backup" : "Choose a backup file or drop it here"}
                        </p>
                    </div>
                    <Button variant="outline" onClick={open}>
                        <Upload className="size-4" />
                        Choose file
                    </Button>
                </div>
            </div>

            <Dialog open={!!dialog} onOpenChange={(isOpen) => !isOpen && !busy && setDialog(null)}>
                <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-light">{mode?.title}</DialogTitle>
                        <DialogDescription>{mode?.description}</DialogDescription>
                    </DialogHeader>

                    {(dialog?.mode === "restore" || dialog?.mode === "unlock") && (
                        <BackupFile
                            fileName={dialog.fileName}
                            encrypted={dialog.mode === "unlock" || dialog.backup.encrypted}
                            exportedAt={dialog.mode === "restore" ? dialog.backup.exportedAt : undefined}
                        />
                    )}

                    {data && (
                        <div className="rounded-sm border border-border/50">
                            {BACKUP_SECTIONS.map((key) => {
                                const { label, icon: Icon, summary } = SECTIONS[key];
                                const detail = summary(data);
                                if (dialog?.mode === "restore" && !detail) return null;
                                return (
                                    <label
                                        key={key}
                                        htmlFor={`backup-${key}`}
                                        className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-50">
                                        <Checkbox
                                            id={`backup-${key}`}
                                            checked={selected.has(key)}
                                            disabled={!detail || busy}
                                            onCheckedChange={(checked) =>
                                                setSelected((prev) => {
                                                    const next = new Set(prev);
                                                    if (checked) next.add(key);
                                                    else next.delete(key);
                                                    return next;
                                                })
                                            }
                                        />
                                        <Icon className="size-4 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">{label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {detail ?? "Nothing to export"}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {dialog?.mode === "restore" && dialog.backup.skipped.length > 0 && (
                        <p className="text-xs text-destructive">
                            Skipped invalid sections:{" "}
                            {dialog.backup.skipped.map((key) => SECTIONS[key].label).join(", ")}
                        </p>
                    )}

                    {(dialog?.mode === "export" || dialog?.mode === "unlock") && (
                        <form
                            className="space-y-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit();
                            }}>
                            <Label htmlFor="backup-password" className="text-sm">
                                Password
                                {dialog.mode === "export" && <span className="text-muted-foreground">(optional)</span>}
                            </Label>
                            <PasswordInput
                                id="backup-password"
                                autoFocus={dialog.mode === "unlock"}
                                autoComplete={dialog.mode === "export" ? "new-password" : "off"}
                                value={password}
                                disabled={busy}
                                aria-invalid={!!passwordError}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                            {dialog.mode === "export" && (password || hasSensitive) && (
                                <p className="flex gap-2 text-xs text-muted-foreground">
                                    {password ? (
                                        <ShieldCheck className="size-4 shrink-0 text-primary" />
                                    ) : (
                                        <ShieldAlert className="size-4 shrink-0 text-primary" />
                                    )}
                                    {password
                                        ? "Encrypted with AES-256. The backup can't be restored without this password."
                                        : "Without a password, API keys are saved in plain text."}
                                </p>
                            )}
                        </form>
                    )}

                    {dialog?.mode === "restore" && (
                        <p className="text-xs text-muted-foreground">
                            Preferences replace your current ones. Addons and accounts are added alongside existing
                            ones; duplicates are skipped.
                        </p>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={busy}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button disabled={!canSubmit} onClick={submit}>
                            <ActionIcon className={cn("size-4", busy && "animate-spin")} />
                            {mode?.action}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
