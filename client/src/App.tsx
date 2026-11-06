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

const features: { label: string; Icon: Icon }[] = [
  { label: "Join a group", Icon: UsersIcon },
  { label: "Track listings", Icon: ClipboardTextIcon },
  { label: "Manage status", Icon: ToggleRightIcon },
];

export default function App(): JSX.Element {
  return (
    <main className="flex flex-col min-h-screen">
      <header className="flex items-center gap-2 pt-1 px-4">
        <img src={MothballSVG} className="w-5" alt="Mothball icon" />
        <h1 className="text-3xl text-plum font-gaegu font-bold">Mothball</h1>
      </header>

      <section
        className="relative flex flex-1 flex-col items-center justify-center text-center px-6 md:px-20 ml-3 mr-2 mb-3 py-10 rounded-2xl border border-plum/15 ring-1 ring-inset ring-white/50 shadow-lg shadow-plum/10 bg-lavender/60 bg-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        <CoatHangerIcon
          size={150}
          weight="fill"
          className="mx-auto mb-4 text-plum"
          aria-hidden="true"
        />
        <h1 className="text-4xl md:text-5xl text-center text-plum font-bold">
          One closet, multiple people
        </h1>
        <h1 className="text-4xl md:text-5xl text-center text-plum font-bold mb-4">
          Zero duplicates.
        </h1>
        <p className="text-lg md:text-xl text-plum/80 mb-8 max-w-xl">
          Share one closet and always know what's listed and what's still
          waiting to be uploaded.
        </p>
        <div className="flex gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full border border-plum bg-gradient-to-b from-plum/80 to-plum px-7 py-3 text-base font-medium text-white shadow-lg shadow-plum/30 ring-1 ring-inset ring-white/25 transition duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-plum/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
          >
            Get Started
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-plum/60 bg-gradient-to-b from-white to-lavender/60 px-7 py-3 text-base font-medium text-plum shadow-lg shadow-plum/10 ring-1 ring-inset ring-white transition duration-200 hover:border-plum hover:from-white hover:to-lavender hover:shadow-xl hover:shadow-plum/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
          >
            Login
          </Link>
        </div>
      </section>

      <footer className="bg-white pb-5">
        <ul className="mx-auto flex max-w-4xl justify-around px-6">
          {features.map(({ label, Icon }) => (
            <li key={label} className="flex flex-col items-center gap-3">
              <div className="rounded-xl text-plum">
                <Icon size={50} weight="fill" aria-hidden="true" />
              </div>
              <span className="text-lg text-plum">{label}</span>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
