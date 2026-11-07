import { emailLayout } from "./layout.js";

export const forgotPasswordHtml = (resetUrl: string) =>
  emailLayout({
    preheader: "A little password reset for your Mothball account.",
    tagline: "A LITTLE ACCOUNT HELP",
    heading: "Forgot something?",
    body: "No worries! It happens to the best of us. Click below to choose a new password for your Mothball account.",
    button: { label: "Reset my password", url: resetUrl },
    note: "This link expires in 1 hour.",
    joke: "What’s a moth’s favorite type of glasses? Lamp shades.",
    footer:
      "You’re receiving this because someone requested a password reset for your Mothball account. If you didn’t make this request, you can safely ignore this email.",
  });
