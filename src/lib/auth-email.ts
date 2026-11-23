// Email-safe markup: tables + inline styles; <style> only enhances clients that keep it (dark mode, mobile)
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

export const EMAIL_OTP_EXPIRY_MINUTES = Number(process.env.EMAIL_OTP_EXPIRY_MINUTES) || 15;

const OTP_COPY = {
    verify: {
        name: "verification code",
        heading: "Verify your email",
        action: "verify your email address",
        why: "this address was used to sign up or log in at",
        ignore: "",
    },
    reset: {
        name: "password reset code",
        heading: "Reset your password",
        action: "reset your password",
        why: "a password reset was requested for this address at",
        ignore: " Your password won't change.",
    },
};

const link = (href: string, label: string) =>
    `<a href="${href}" class="soft" style="color:#6F6F6F;text-decoration:underline;">${label}</a>`;

interface Layout {
    appURL: string;
    subject: string;
    preheader: string;
    heading: string;
    intro: string;
    /** Amber block content (brings its own padding, so a link can fill the block): the code, or a call to action */
    feature: string;
    note: string;
    /** Completes "You received this because …"; receives the linked host */
    why: (site: string) => string;
}

function layout({ appURL, subject, preheader, heading, intro, feature, note, why }: Layout) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${subject}</title>
<style>
@media (prefers-color-scheme: dark) {
  .bg { background: #161616 !important; }
  .ink { color: #EDEDED !important; }
  .soft { color: #A0A0A0 !important; }
  .rule { border-color: #3E3E3E !important; }
}
@media (max-width: 520px) {
  .pad { padding: 32px 20px !important; }
  .code { font-size: 32px !important; letter-spacing: 8px !important; }
}
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:#FCFCFC;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:#FCFCFC;">
<tr><td align="center" class="pad" style="padding:48px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:${sans};">
  <tr><td style="padding-bottom:40px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle"><img src="${new URL("/icon-96.png", appURL)}" width="32" height="32" alt="" style="display:block;border:0;"></td>
      <td valign="middle" class="ink" style="padding-left:10px;font-size:16px;font-weight:700;color:#171717;">DebridUI</td>
    </tr></table>
  </td></tr>
  <tr><td class="ink" style="font-size:24px;line-height:32px;font-weight:700;color:#171717;">${heading}</td></tr>
  <tr><td class="soft" style="padding:8px 0 28px;font-size:15px;line-height:24px;color:#6F6F6F;">${intro}</td></tr>
  <tr><td style="background:#FDCE45;">${feature}</td></tr>
  <tr><td class="soft" style="padding:14px 0 40px;font-size:14px;line-height:22px;color:#6F6F6F;">${note}</td></tr>
  <tr><td class="rule soft" style="border-top:1px solid #DEDEDE;padding-top:20px;font-size:12px;line-height:18px;color:#6F6F6F;">
    You received this because ${why(link(appURL, new URL(appURL).host))}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Code stays out of subject and preheader: both show on lock screens and notifications
export function otpEmail(otp: string, appURL: string, kind: keyof typeof OTP_COPY) {
    const { name, heading, action, why, ignore } = OTP_COPY[kind];
    const { origin, protocol, hostname } = new URL(appURL);
    const subject = `Your DebridUI ${name}`;
    const note = `This code expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes. Don't share it with anyone. DebridUI will never ask you for it.`;
    const whyText = (site: string) => `${why} ${site}. If that wasn't you, ignore this email.${ignore}`;
    const html = layout({
        appURL,
        subject,
        preheader: `Your ${name} expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes.`,
        heading,
        intro: `Enter this code in DebridUI to ${action}.`,
        feature: `<div class="code" style="padding:24px 28px;font-family:${mono};font-size:40px;line-height:48px;font-weight:700;letter-spacing:12px;color:#171717;">${otp}</div>`,
        note,
        why: whyText,
    });
    const text = `Your DebridUI ${name} is ${otp}\n\nEnter it in DebridUI to ${action}. ${note}\n\nYou received this because ${whyText(appURL)}`;

    // Origin-bound code for mail clients and password managers (draft-goto-otp-token); needs a trustworthy origin
    const trustworthy = protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";
    const headers = trustworthy ? { "OTP-Token": `"${otp}"; origin="${origin}"` } : undefined;

    return { subject, html, text, headers };
}

/** Sent instead of a code when someone signs up with an address that already has an account. */
export function existingAccountEmail(appURL: string) {
    const loginURL = new URL("/login", appURL).href;
    const resetURL = new URL("/forgot-password", appURL).href;
    const subject = "You already have a DebridUI account";
    const intro =
        "Someone tried to create a DebridUI account with this email address. You already have one, so no new account was created.";
    const why = (site: string) =>
        `this address was entered on the sign-up page at ${site}. If that wasn't you, ignore this email. Your account hasn't changed.`;
    const html = layout({
        appURL,
        subject,
        preheader: "Log in to your existing account instead.",
        heading: "You already have an account",
        intro,
        feature: `<a href="${loginURL}" style="display:block;padding:24px 28px;font-size:16px;line-height:24px;font-weight:700;color:#171717;text-decoration:none;">Log in to DebridUI</a>`,
        note: `Forgot your password? ${link(resetURL, "Reset it")}. If you usually sign in with Google, use that instead.`,
        why,
    });
    const text = `${intro}\n\nLog in: ${loginURL}\nForgot your password? Reset it: ${resetURL}\nIf you usually sign in with Google, use that instead.\n\nYou received this because ${why(appURL)}`;
    return { subject, html, text };
}
