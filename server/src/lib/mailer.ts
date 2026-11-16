import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { OAuth2Client } from "google-auth-library";

const {
  GMAIL_REFRESH_TOKEN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  BREVO_API_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM_EMAIL,
  MAIL_FROM_NAME,
} = process.env;

type MailTransport = "gmail" | "brevo" | "smtp";

const transport: MailTransport =
  GMAIL_REFRESH_TOKEN && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
    ? "gmail"
    : BREVO_API_KEY
      ? "brevo"
      : "smtp";

if (transport === "smtp" && (!SMTP_USER || !SMTP_PASS)) {
  throw new Error(
    "Set GMAIL_REFRESH_TOKEN, BREVO_API_KEY, or SMTP_USER and SMTP_PASS",
  );
}

const fromEmail = MAIL_FROM_EMAIL ?? SMTP_USER ?? "";
const fromName = MAIL_FROM_NAME ?? "Mothball";

if (transport !== "smtp" && !fromEmail) {
  throw new Error("Set MAIL_FROM_EMAIL to the address emails are sent from");
}

const port = Number(SMTP_PORT) || 465;

const smtpTransporter: Transporter | null =
  transport === "smtp"
    ? nodemailer.createTransport({
        host: SMTP_HOST ?? "smtp.gmail.com",
        port,
        secure: port === 465,
        requireTLS: true,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
        pool: true,
        maxConnections: 2,
        maxMessages: 50,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      })
    : null;

const mimeBuilder = nodemailer.createTransport({
  streamTransport: true,
  buffer: true,
  newline: "windows",
});

const gmailClient =
  transport === "gmail"
    ? new OAuth2Client({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      })
    : null;

gmailClient?.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

function stripHtml(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function maskCodes(subject: string) {
  return subject.replace(/\d{6}/g, "******");
}

async function sendWithGmail(to: string, subject: string, html: string) {
  const built = await mimeBuilder.sendMail({
    from: { name: fromName, address: fromEmail },
    to,
    subject,
    html,
    text: stripHtml(html),
  });

  const raw = Buffer.from(built.message as Buffer).toString("base64url");
  const { token } = await gmailClient!.getAccessToken();

  if (!token) {
    throw new Error("Gmail send failed: couldn't get an access token");
  }

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!res.ok) {
    throw new Error(`Gmail send failed (${res.status}): ${await res.text()}`);
  }

  console.log(`Email sent via Gmail: "${maskCodes(subject)}"`);
}

async function sendWithBrevo(to: string, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: stripHtml(html),
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Brevo send failed (${res.status}): ${await res.text()}`);
  }

  console.log(`Email sent via Brevo: "${maskCodes(subject)}"`);
}

export function mailTransport() {
  return transport;
}

export async function sendMail(to: string, subject: string, html: string) {
  if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
    throw new Error("Invalid characters in email headers");
  }

  if (transport === "gmail") {
    await sendWithGmail(to, subject, html);
    return;
  }

  if (transport === "brevo") {
    await sendWithBrevo(to, subject, html);
    return;
  }

  await smtpTransporter!.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
    text: stripHtml(html),
  });
}

export async function verifyMailer() {
  if (!smtpTransporter) {
    console.log(`mailer ready (${transport})`);
    return;
  }

  try {
    await smtpTransporter.verify();
    console.log("mailer ready (smtp)");
  } catch (error) {
    console.error(
      "mailer check failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
