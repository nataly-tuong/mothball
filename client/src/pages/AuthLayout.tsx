import type { JSX } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MothballSVG from "../assets/favicon.svg";
import BgImage from "../assets/dddepth-061.jpg";

const tints: Record<string, string> = {
  "/login": "bg-lavender/60",
  "/register": "bg-sky-200/30",
  "/forgot-password": "bg-orange-200/40",
};

export default function AuthLayout(): JSX.Element {
  const { pathname } = useLocation();
  const tint = tints[pathname] ?? "bg-lavender/60";

  return (
    <main className="flex min-h-screen">
      <div
        className={`relative flex flex-1 m-4 py-10 rounded-2xl flex-col items-center justify-center border border-plum/15 ring-1 ring-inset ring-white/50 shadow-lg shadow-plum/10 ${tint} bg-blend-overlay bg-cover bg-center transition-colors duration-700 ease-in-out`}
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        <img
          src={MothballSVG}
          className="mx-auto w-40"
          alt="Mothball Icon, Moth on a pearl"
        />
        <h1 className="text-7xl text-center text-plum font-gaegu font-extrabold mb-5">
          Mothball
        </h1>
        <p className="text-plum">
          "Uh, which one again? idk. oh <span className="italic">that one</span>
          "
        </p>
      </div>

      <div className="flex flex-col bg-white flex-1 px-10 gap-6 items-center justify-center">
        <Outlet />
      </div>
    </main>
  );
}
