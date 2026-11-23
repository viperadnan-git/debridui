export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { mailer } = await import("@/lib/mailer");
    // Emails send after the response, so a broken SMTP config would otherwise only surface per send
    await mailer
        ?.verify()
        .catch((error) => console.error("SMTP connection failed; verification and reset emails won't send:", error));
}
