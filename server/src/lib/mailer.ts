import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport>;

export async function sendMail(to: string, subject: string, html: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!user || !pass) {
    throw new Error("Missing Gmail environment variables");
  }

  transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter.sendMail({
    from: user,
    to,
    subject,
    html,
  });
}
