import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { after } from "next/server";
import type { Transporter } from "nodemailer";
import { v7 as uuidv7 } from "uuid";
import { EMAIL_OTP_EXPIRY_MINUTES, existingAccountEmail, otpEmail } from "@/lib/auth-email";
import { db } from "@/lib/db/drizzle";
import { mailer } from "@/lib/mailer";

const isGoogleOAuthEnabled = !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const isEmailSignupDisabled = process.env.NEXT_PUBLIC_DISABLE_EMAIL_SIGNUP === "true";
const appURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Everything that sends mail; built only when SMTP is configured (opt-in)
function emailFeatures(transport: Transporter) {
    return {
        plugin: emailOTP({
            overrideDefaultEmailVerification: true,
            expiresIn: EMAIL_OTP_EXPIRY_MINUTES * 60,
            // Resend the still-valid code instead of a new one, so delayed emails don't conflict
            resendStrategy: "reuse",
            // Encrypted (not hashed) so "reuse" can recover the code
            storeOTP: "encrypted",
            async sendVerificationOTP({ email, otp, type }) {
                await transport.sendMail({
                    to: email,
                    ...otpEmail(otp, appURL, type === "forget-password" ? "reset" : "verify"),
                });
            },
        }),
        // Sign-up with a taken address returns a generic response (no enumeration); tell the owner instead
        async onExistingUserSignUp({ user }: { user: { email: string } }) {
            await transport.sendMail({ to: user.email, ...existingAccountEmail(appURL) });
        },
    };
}

const email = mailer ? emailFeatures(mailer) : null;
export const isEmailEnabled = !!email;

export const auth = betterAuth({
    baseURL: appURL,
    trustedOrigins: [appURL],
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    user: {
        deleteUser: {
            enabled: true,
        },
    },
    emailAndPassword: {
        enabled: true,
        disableSignUp: isEmailSignupDisabled,
        // A reset may follow a compromise, so sign out other devices
        revokeSessionsOnPasswordReset: true,
        requireEmailVerification: isEmailEnabled,
        onExistingUserSignUp: email?.onExistingUserSignUp,
    },
    emailVerification: {
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },
    socialProviders: isGoogleOAuthEnabled
        ? {
              google: {
                  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              },
          }
        : undefined,
    session: {
        expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
        updateAge: 60 * 60 * 24 * 7, // Update session every 7 days
        freshAge: 0, // default 1 day would 403 /list-sessions for any older session
        cookieCache: {
            enabled: true,
            maxAge: 1 * 60 * 60, // 1 hour cache
            strategy: "jwt",
        },
    },
    advanced: {
        database: {
            generateId: () => uuidv7(),
        },
        cookiePrefix: "debridui",
        // Send emails after the response so its timing doesn't reveal whether an account exists
        backgroundTasks: { handler: after },
    },
    plugins: [...(email ? [email.plugin] : []), nextCookies()],
});
