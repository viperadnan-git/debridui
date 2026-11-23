import { createTransport } from "nodemailer";

const { SMTP_URL, SMTP_FROM } = process.env;
// Most relays reject mail without a From address, so a half-configured SMTP must fail loudly
if (SMTP_URL && !SMTP_FROM) throw new Error("SMTP_FROM is required when SMTP_URL is set");

/** Null when SMTP isn't configured; email verification and password reset are opt-in on it. */
export const mailer = SMTP_URL ? createTransport(SMTP_URL, { from: SMTP_FROM }) : null;
