import { z } from "zod";
import { addonSchema, createAccountSchema, pickValid, serverSettingsSchema, settingsSchema } from "./schemas";

export const BACKUP_FORMAT = "debridui-backup";
export const BACKUP_VERSION = 1;

// Never edit a shipped migration; add one and bump BACKUP_VERSION
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

const preferenceSettingsSchema = settingsSchema.omit({ tmdbApiKey: true });

export const backupSections = {
    preferences: z.object({
        theme: z.enum(["light", "dark", "system"]).optional().catch(undefined),
        settings: z.unknown().transform((value) => pickValid(preferenceSettingsSchema, value)),
    }),
    addons: z.array(addonSchema).max(500, "Too many addons"),
    accounts: z.array(createAccountSchema).max(100, "Too many accounts"),
    integrations: serverSettingsSchema,
};

export type BackupSection = keyof typeof backupSections;
export type BackupData = { [K in BackupSection]?: z.infer<(typeof backupSections)[K]> };

export const BACKUP_SECTIONS = Object.keys(backupSections) as BackupSection[];

// OWASP 2023 minimum for PBKDF2-SHA256
const KDF_ITERATIONS = 600_000;

const encryptedSchema = z.object({
    cipher: z.literal("AES-256-GCM"),
    kdf: z.literal("PBKDF2-SHA256"),
    iterations: z.number().int().min(100_000).max(10_000_000),
    salt: z.base64(),
    iv: z.base64(),
    ciphertext: z.base64(),
});

const envelopeSchema = z
    .object({
        format: z.literal(BACKUP_FORMAT, { error: "Not a DebridUI backup file" }),
        version: z.number().int().positive(),
        exportedAt: z.iso.datetime().optional().catch(undefined),
        data: z.record(z.string(), z.unknown()).optional(),
        encrypted: encryptedSchema.optional(),
    })
    .refine((e) => e.data || e.encrypted, "Backup file has no data");

export class BackupPasswordError extends Error {}

const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
    // Secure contexts only (HTTPS or localhost)
    if (!globalThis.crypto?.subtle) throw new Error("Encrypted backups need an HTTPS connection");
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
        "deriveKey",
    ]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt, iterations },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function createBackup(data: BackupData, password?: string) {
    const header = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString() };
    if (!password) return { ...header, data };

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, KDF_ITERATIONS);
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(JSON.stringify(data))
    );
    return {
        ...header,
        encrypted: {
            cipher: "AES-256-GCM",
            kdf: "PBKDF2-SHA256",
            iterations: KDF_ITERATIONS,
            salt: toBase64(salt),
            iv: toBase64(iv),
            ciphertext: toBase64(new Uint8Array(ciphertext)),
        },
    };
}

async function decrypt(encrypted: z.infer<typeof encryptedSchema>, password: string) {
    const key = await deriveKey(password, fromBase64(encrypted.salt), encrypted.iterations);
    try {
        const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: fromBase64(encrypted.iv) },
            key,
            fromBase64(encrypted.ciphertext)
        );
        return JSON.parse(new TextDecoder().decode(plain)) as unknown;
    } catch {
        throw new BackupPasswordError("Wrong password");
    }
}

function parseSection<K extends BackupSection>(key: K, value: unknown) {
    const schema = backupSections[key];
    // Drop bad list items individually so the rest of the list survives
    if (schema instanceof z.ZodArray && Array.isArray(value)) {
        value = value.filter((item) => schema.element.safeParse(item).success);
    }
    const result = schema.safeParse(value);
    return result.success ? (result.data as BackupData[K]) : undefined;
}

export async function parseBackup(text: string, password?: string) {
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error("File is not valid JSON");
    }

    const envelope = envelopeSchema.safeParse(json);
    if (!envelope.success) throw new Error(envelope.error.issues[0]?.message ?? "Invalid backup file");

    const { version, exportedAt, encrypted } = envelope.data;
    if (version > BACKUP_VERSION) {
        throw new Error("This backup was made by a newer version of DebridUI. Update the app and try again.");
    }

    let raw = envelope.data.data;
    if (encrypted) {
        if (!password) throw new BackupPasswordError("This backup is password protected");
        const decrypted = z.record(z.string(), z.unknown()).safeParse(await decrypt(encrypted, password));
        if (!decrypted.success) throw new Error("Invalid backup file");
        raw = decrypted.data;
    }
    if (!raw) throw new Error("Invalid backup file");

    for (let v = version; v < BACKUP_VERSION; v++) {
        const migrate = MIGRATIONS[v];
        if (!migrate) throw new Error(`Backup version ${v} is no longer supported`);
        raw = migrate(raw);
    }

    const data: BackupData = {};
    const skipped: BackupSection[] = [];
    for (const key of BACKUP_SECTIONS) {
        if (raw[key] === undefined) continue;
        const parsed = parseSection(key, raw[key]);
        if (parsed === undefined) skipped.push(key);
        else Object.assign(data, { [key]: parsed });
    }

    if (Object.keys(data).length === 0) throw new Error("Backup contains nothing to restore");
    return { exportedAt, encrypted: !!encrypted, data, skipped };
}

export type ParsedBackup = Awaited<ReturnType<typeof parseBackup>>;
