import type { JSX } from "react";
import {
  UsersIcon,
  ClipboardTextIcon,
  ToggleRightIcon,
  CoatHangerIcon,
} from "@phosphor-icons/react";

import type { Icon } from "@phosphor-icons/react";
import MothballSVG from "./assets/favicon.svg";
import BgImage from "./assets/dddepth-061.jpg";
import { Link } from "react-router-dom";

const steps: { title: string; text: string; Icon: Icon }[] = [
  {
    title: "Join a group",
    text: "Invite the people you share a closet with, so everyone sees the same inventory.",
    Icon: UsersIcon,
  },
  {
    title: "Track listings",
    text: "Log each item once, so nobody lists the same piece twice.",
    Icon: ClipboardTextIcon,
  },
  {
    title: "Manage status",
    text: "Mark what’s listed and what’s still waiting to be uploaded.",
    Icon: ToggleRightIcon,
  },
];

const previewItems = [
  { name: "Vintage denim jacket", meta: "Added by Viktor", listed: true },
  { name: "Green wool coat", meta: "Added by Caitlyn", listed: false },
  { name: "Black ankle boots", meta: "Added by Viktor", listed: true },
];

const glowRing = "shadow-[0_0_0_5px_#f7f7f7]";

const pillBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac";

const primaryButton = `${pillBase} border border-plum bg-linear-to-b from-plum/80 to-plum px-7 py-3 text-base text-white shadow-lg shadow-plum/30 ring-1 ring-inset ring-white/25 hover:brightness-110 hover:shadow-xl hover:shadow-plum/40`;

const secondaryButton = `${pillBase} border border-plum/60 bg-linear-to-b from-white to-lavender/60 px-7 py-3 text-base text-plum shadow-lg shadow-plum/10 ring-1 ring-inset ring-white hover:border-plum hover:to-lavender hover:shadow-xl hover:shadow-plum/20`;

const navButton = `${pillBase} border border-plum bg-linear-to-b from-plum/80 to-plum px-4 py-2 text-sm text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 hover:brightness-110`;

function ClosetPreview(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={`absolute bottom-0 left-1/2 z-10 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 translate-y-1/2 rounded-[30px] bg-white p-5 text-left ${glowRing}`}
    >
      <div className="mb-4">
        <p className="font-fredoka text-xl font-medium leading-tight">
          Viktor &amp; Caitlyn's closet
        </p>
        <p className="text-sm text-plum/60">2 members · 3 items</p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {previewItems.map(({ name, meta, listed }) => (
          <li
            key={name}
            className="flex items-center gap-3 rounded-2xl border border-plum/10 p-3"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lavender">
              <CoatHangerIcon size={22} weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold leading-tight">
                {name}
              </p>
              <p className="text-sm text-plum/60">{meta}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                listed ? "bg-lilac/20 text-plum" : "bg-mist text-plum/70"
              }`}
            >
              {listed ? "Listed" : "To upload"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-mist text-plum">
      <div className="relative">
        <nav
          aria-label="Main"
          className={`absolute inset-x-4 top-4 z-20 mx-auto flex max-w-3xl items-center justify-between rounded-[22px] border border-plum/10 bg-white px-4 py-2 ${glowRing}`}
        >
          <Link to="/" className="flex items-center gap-2">
            <img src={MothballSVG} alt="" className="w-5" />
            <span className="font-gaegu text-3xl font-bold leading-none">
              Mothball
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm font-medium">
            <a
              href="#how-it-works"
              className="hidden px-2 py-1 transition hover:opacity-60 sm:inline"
            >
              How it works
            </a>
            <Link to="/login" className="px-2 py-1 transition hover:opacity-60">
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full border-[1.5px] font-semibold transition duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac border-transparent bg-plum text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_0_1px_rgba(0,0,0,0.15),0_3px_2px_0_rgba(0,0,0,0.06)] hover:brightness-110 px-6 py-3"
            >
              Get started
            </Link>
          </div>
        </nav>

        <section
          className="flex flex-col items-center bg-lavender/60 bg-cover bg-center bg-blend-overlay px-6 pb-44 pt-36 text-center"
          style={{ backgroundImage: `url(${BgImage})` }}
        >
          <h1 className="font-fredoka mt-10text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            One closet for multiple people
          </h1>
          <p className="mt-5 mb-10 max-w-xl text-lg text-plum/80">
            Always know what’s listed and what’s still waiting to be uploaded.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className={primaryButton}>
              Get Started
            </Link>
            <Link to="/login" className={secondaryButton}>
              Login
            </Link>
          </div>
        </section>

        <ClosetPreview />
      </div>

      <main>
        <section
          id="how-it-works"
          className="mx-auto max-w-2xl scroll-mt-8 px-6 pb-24 pt-44"
        >
          <h2 className="font-fredoka text-3xl font-medium leading-tight tracking-tight md:text-4xl">
            How Mothball works
          </h2>
          <p className="mt-4 text-base text-plum/80">
            One shared closet for everyone who sells from it, with a clear
            record of what’s done and what’s next.
          </p>

          <ol className="mt-10 flex flex-col">
            {steps.map(({ title, text, Icon }) => (
              <li
                key={title}
                className="flex gap-4 border-t border-plum/10 py-6 last:border-b"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-plum/10 bg-white">
                  <Icon size={26} weight="fill" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-snug">
                    {title}
                  </h3>
                  <p className="mt-1 text-base text-plum/70">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-24 text-center">
          <h2 className="font-fredoka text-3xl font-medium leading-tight tracking-tight md:text-4xl">
            Start your shared closet
          </h2>
          <p className="mt-4 text-base text-plum/80">
            Create an account and invite the people you share with.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className={primaryButton}>
              Get Started
            </Link>
            <Link to="/login" className={secondaryButton}>
              Login
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-plum/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-plum/70">
          <span className="font-gaegu text-2xl font-bold text-plum">
            Mothball
          </span>
          <nav aria-label="Footer" className="flex gap-5">
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-plum"
            >
              Privacy
            </Link>
          </nav>
          <span>© {new Date().getFullYear()} Mothball</span>
        </div>
      </footer>
    </div>
  );
}
