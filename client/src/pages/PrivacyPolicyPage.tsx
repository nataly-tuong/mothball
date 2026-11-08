import type { JSX, ReactNode } from "react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "ntuong1117@gmail.com";
const EFFECTIVE_DATE = "[November 07, 2026]";
const REPO_URL = "https://github.com/nataly-tuong/mothball";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-fredoka text-xl font-medium text-plum">{title}</h2>
      {children}
    </section>
  );
}

const body = "text-sm leading-relaxed text-plum/80";
const list = "list-disc space-y-1 pl-5 text-sm leading-relaxed text-plum/80";

export default function PrivacyPolicyPage(): JSX.Element {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-fredoka text-4xl font-medium text-plum">
          Privacy Policy
        </h1>
        <p className="text-sm text-plum/60">Effective {EFFECTIVE_DATE}</p>
        <p className={body}>
          Mothball is a shared-closet inventory app. This policy explains what
          information we collect, why, and the choices you have. We keep it
          short because we collect very little.
        </p>
      </header>

      <Section title="What we collect">
        <ul className={list}>
          <li>
            <strong>Account details:</strong> your name and email address. If
            you sign up with a password, we store only a hash of it, never the
            password itself. If you sign in with Google, we store your Google
            account ID.
          </li>
          <li>
            <strong>Closet data:</strong> the closets you create or join, the
            items in them, and anything you add to those items.
          </li>
          <li>
            <strong>Technical data:</strong> your IP address and basic request
            details, which our servers and hosting providers process to run the
            service, limit abuse, and fix problems.
          </li>
        </ul>
      </Section>

      <Section title="Signing in with Google">
        <p className={body}>
          If you choose Google sign-in, Google shares your email address, name,
          Google account ID, and whether your email is verified. We use this
          only to create your account and sign you in. We don’t sell it, share
          it for advertising, or use it for anything else.
        </p>
        <p className={body}>
          Mothball’s use and transfer of information received from Google APIs
          will adhere to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="link"
            target="_blank"
            rel="noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </Section>

      <Section title="How we use your information">
        <ul className={list}>
          <li>To create and secure your account and keep you signed in.</li>
          <li>
            To send emails you need: verification codes, password reset links,
            and security notices.
          </li>
          <li>
            To run the shared closet, including showing your name and the items
            you add to other members of closets you belong to.
          </li>
          <li>To prevent abuse and keep the service working.</li>
        </ul>
        <p className={body}>We don’t sell your data and we don’t show ads.</p>
      </Section>

      <Section title="Cookies">
        <p className={body}>
          We use one cookie, which keeps you signed in. It isn’t readable by
          scripts and lasts 24 hours, or 30 days if you choose “Remember me”. We
          don’t use advertising or tracking cookies.
        </p>
      </Section>

      <Section title="Who we share data with">
        <p className={body}>
          We use these services to run Mothball. They process data only to
          provide their service to us:
        </p>
        <ul className={list}>
          <li>Render, which hosts our server.</li>
          <li>Neon, which hosts our database.</li>
          <li>
            Vercel, which hosts the website and passes requests to our server.
          </li>
          <li>Google, for sign-in and for sending our emails.</li>
          <li>
            Have I Been Pwned, which checks whether a password has appeared in a
            known breach. We send only a small part of a hashed password, so the
            password is never revealed.
          </li>
        </ul>
        <p className={body}>
          We may also disclose information if the law requires it.
        </p>
      </Section>

      <Section title="How long we keep it">
        <ul className={list}>
          <li>
            Account and closet data is kept until you delete your account.
          </li>
          <li>
            Verification codes expire after 15 minutes and reset links after 1
            hour.
          </li>

          <li>
            Accounts that never verify their email are deleted after 7 days.
          </li>
        </ul>
      </Section>

      <Section title="Your choices">
        <ul className={list}>
          <li>
            <li>
              <strong>Delete your account</strong> any time in Settings. This
              removes your account and personal data from our database.
            </li>
            <li>
              Deleted data is removed right away, though short-term database
              history can keep a copy for up to about 6 hours.
            </li>
          </li>
          <li>
            Email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link">
              {CONTACT_EMAIL}
            </a>{" "}
            to ask for a copy of your data or to correct it.
          </li>
        </ul>
      </Section>

      <Section title="Security">
        <p className={body}>
          Passwords are hashed, connections use HTTPS, and sign-in attempts are
          rate limited. No system is perfectly secure, but we take reasonable
          steps to protect your data.
        </p>
      </Section>

      <Section title="Children">
        <p className={body}>
          Mothball isn’t meant for children under 13, and we don’t knowingly
          collect their information. If you think a child has given us data,
          contact us and we’ll delete it.
        </p>
      </Section>

      <Section title="Open source">
        <p className={body}>
          Mothball’s code is public at{" "}
          <a href={REPO_URL} className="link" target="_blank" rel="noreferrer">
            our GitHub repository
          </a>
          . This policy covers the version we host. Anyone who runs their own
          copy is responsible for their own data practices.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p className={body}>
          If we change this policy, we’ll update the date above and, for
          significant changes, tell you by email. Questions? Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Link to="/" className="link text-sm">
        Back to Mothball
      </Link>
    </main>
  );
}
