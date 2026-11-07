import { emailLayout } from "./layout.js";

export const welcomeEmailHtml = (code: string) =>
  emailLayout({
    preheader: `Your Mothball verification code is ${code}.`,
    tagline: "ONE LITTLE THING BEFORE YOU BEGIN",
    heading: "One more little thing!",
    body: "Welcome to Mothball! Enter this code to confirm your email address.",
    code,
    note: "This code expires in 15 minutes.",
    joke: "What’s a moth’s favorite type of glasses? Lamp shades.",
    footer:
      "You’re receiving this because you signed up for Mothball. If you didn’t, you can safely ignore this email.",
  });
