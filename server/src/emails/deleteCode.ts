import { emailLayout } from "./layout.js";

export const deleteCodeHtml = (code: string) =>
  emailLayout({
    preheader: `Your code to delete your Mothball account is ${code}.`,
    tagline: "A QUICK SECURITY NOTE",
    heading: "Delete your account?",
    body: "Enter this code to permanently delete your Mothball account. If you didn’t ask for this, ignore this email and consider changing your password.",
    code,
    note: "This code expires in 15 minutes.",
    footer:
      "You’re receiving this because someone asked to delete your Mothball account.",
  });
