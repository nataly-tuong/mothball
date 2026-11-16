import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const {
  BREVO_API_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM_EMAIL,
  MAIL_FROM_NAME,
} = process.env;

if (!BREVO_API_KEY && (!SMTP_USER || !SMTP_PASS)) {
  throw new Error("Set BREVO_API_KEY, or SMTP_USER and SMTP_PASS");
}

const fromEmail = MAIL_FROM_EMAIL ?? SMTP_USER ?? "";
const fromName = MAIL_FROM_NAME ?? "Mothball";

if (BREVO_API_KEY && !fromEmail) {
  throw new Error("Set MAIL_FROM_EMAIL to a sender verified in Brevo");
}

const port = Number(SMTP_PORT) || 465;

const transporter: Transporter | null = BREVO_API_KEY
  ? null
  : nodemailer.createTransport({
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
    });

function stripHtml(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
}

export async function sendMail(to: string, subject: string, html: string) {
  if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
    throw new Error("Invalid characters in email headers");
  }

  if (!transporter) {
    await sendWithBrevo(to, subject, html);
    return;
  }

  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
    text: stripHtml(html),
  });
}

export async function verifyMailer() {
  if (!transporter) {
    console.log("mailer ready (Brevo API)");
    return;
  }

  try {
    await transporter.verify();
    console.log("mailer ready");
  } catch (error) {
    console.error(
      "mailer check failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
