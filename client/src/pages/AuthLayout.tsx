import type { CSSProperties, JSX } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
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
    <main
      className={`flex h-dvh overflow-hidden ${tint} bg-(image:--auth-bg) bg-cover bg-center bg-blend-overlay md:bg-none md:bg-white`}
      style={{ "--auth-bg": `url(${BgImage})` } as CSSProperties}
    >
      <div
        className={`relative hidden md:flex flex-1 m-4 py-10 rounded-2xl flex-col items-center justify-center border border-plum/15 ring-1 ring-inset ring-white/50 shadow-lg shadow-plum/10 ${tint} bg-blend-overlay bg-cover bg-center transition-colors duration-700 ease-in-out`}
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center-safe gap-5 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-10 md:bg-white md:py-10">
        <Link
          to="/"
          className="flex flex-col items-center gap-1 self-center md:hidden"
        >
          <img src={MothballSVG} className="w-16" alt="" />
          <span className="font-gaegu text-5xl font-extrabold leading-none text-plum">
            Mothball
          </span>
        </Link>
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-plum/10 bg-white px-5 py-7 shadow-xl shadow-plum/15 sm:px-8 md:max-w-none md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
