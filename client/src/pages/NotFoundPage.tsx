import type { JSX } from "react";
import BgImage from "../assets/dddepth-267.jpg";
import { Link } from "react-router-dom";

export default function NotFoundPage(): JSX.Element {
  return (
    <main>
      <div
        className="flex flex-1 flex-col text-center items-center justify-center min-h-screen bg-lavender/60 bg-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        <h1 className="text-6xl font-fredoka font-bold text-plum">404</h1>
        <h2 className="text-3xl text-plum font-fredoka font-medium">
          Dust bunnies and no Mothball.
        </h2>
        <h2 className="text-3xl text-plum font-fredoka font-medium mb-2">
          This page doesn't exist.
        </h2>
        <p className="text-plum/80 font-fredoka mb-3">Let's get you back!</p>
        <Link to={"/"}>
          <button className="bg-plum cursor-pointer text-white py-2.5 px-10 rounded-lg text-sm font-medium hover:bg-plum/80">
            Back to closet
          </button>
        </Link>
      </div>
    </main>
  );
}
