import { emailLayout } from "./layout.js";

export const passwordChangedHtml = (secureUrl: string) =>
  emailLayout({
    preheader: "Your Mothball password was just changed.",
    tagline: "A QUICK SECURITY NOTE",
    heading: "Password changed",
    body: "The password for your Mothball account was just changed, and any devices that were logged in have been signed out. If that was you, there's nothing else to do.",
    button: { label: "This wasn’t me", url: secureUrl },
    note: "If you didn’t change your password, reset it right away to secure your account.",
    footer:
      "You’re receiving this because the password on your Mothball account was changed.",
  });
