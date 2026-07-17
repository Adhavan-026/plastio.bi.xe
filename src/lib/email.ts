import "server-only";

// Thin wrapper around Resend's HTTP API (no SDK dependency — a plain POST).
// Without RESEND_API_KEY configured (e.g. in local dev), the email is
// logged to the server console instead of sent, so reset/verify links are
// still usable while testing — just copy the link from the terminal.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n[email:dev-mode] Would send to ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Click One <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Failed to send email via Resend:", await res.text());
  }
}
