import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  throw new Error("SMTP_USER and SMTP_PASS must be set");
}

const port = Number(SMTP_PORT) || 465;

const transporter = nodemailer.createTransport({
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

export async function sendMail(to: string, subject: string, html: string) {
  // Newlines in these fields can be used to inject extra email headers
  if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
    throw new Error("Invalid characters in email headers");
  }

  await transporter.sendMail({
    from: MAIL_FROM ?? `Mothball <${SMTP_USER}>`,
    to,
    subject,
    html,
    text: stripHtml(html),
  });
}

export async function verifyMailer() {
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
