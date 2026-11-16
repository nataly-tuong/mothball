import { emailLayout } from "./layout.js";

export const welcomeEmailHtml = (code: string, verifyUrl?: string) =>
  emailLayout({
    preheader: `Your Mothball verification code is ${code}.`,
    tagline: "ONE LITTLE THING BEFORE YOU BEGIN",
    heading: "One more little thing!",
    body: `Welcome to Mothball! Your verification code is ${code}. Enter it to confirm your email address${verifyUrl ? ", or tap the button to do it in one step" : ""}.`,
    code,
    ...(verifyUrl
      ? { button: { label: "Verify my email", url: verifyUrl } }
      : {}),
    note: "This code expires in 15 minutes.",
    joke: "What’s a moth’s favorite type of glasses? Lamp shades.",
    footer:
      "You’re receiving this because you signed up for Mothball. If you didn’t, you can safely ignore this email.",
  });

export const verificationSubject = (code: string) =>
  `${code} is your Mothball verification code`;
