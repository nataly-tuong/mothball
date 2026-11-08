import { emailLayout } from "./layout.js";

export const accountDeletedHtml = () =>
  emailLayout({
    preheader: "Your Mothball account has been deleted.",
    tagline: "GOODBYE FOR NOW",
    heading: "Account deleted",
    body: "Your Mothball account and its data have been deleted. If this wasn’t you, reply to this email right away.",
    footer: "You’re receiving this because your Mothball account was deleted.",
  });
