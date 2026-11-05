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
        className="flex flex-1 flex-col items-center justify-center text-center px-6 md:px-20 ml-3 mr-2 mb-3 py-10 rounded-2xl bg-lavender/60 bg-blend-overlay bg-cover bg-center"
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
          <Link to="/register">
            <button
              type="button"
              className="bg-plum cursor-pointer text-white px-6 py-3 rounded-xl text-base font-medium hover:bg-plum/80"
            >
              Get Started
            </button>
          </Link>
          <Link to="/login">
            <button
              type="button"
              className="border-2 cursor-pointer bg-white border-lavender-gray text-ink px-6 py-3 rounded-xl text-base font-medium hover:bg-lavender/50 hover:border-lilac hover:text-plum active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
            >
              Login
            </button>
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
