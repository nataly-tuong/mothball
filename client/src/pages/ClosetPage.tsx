import type { JSX } from "react";
import { useEffect } from "react";
import MothballSVG from "../assets/favicon.svg";
import BgImage from "../assets/dddepth-267.jpg";

export default function ClosetPage(): JSX.Element {
  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);

  return (
    <main className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between gap-2 pt-1 px-4">
        <div className="flex">
          <img src={MothballSVG} className="w-5" alt="Mothball icon" />
          <h1 className="text-3xl text-plum font-gaegu font-bold">Mothball</h1>
        </div>
        <div className="flex gap-5">
          <button className="text-plum cursor-pointer">Nataly</button>
          <p className="text-plum">|</p>
          <button className="text-plum cursor-pointer">Logout</button>
        </div>
      </header>

      <section
        className="flex flex-1 flex-col items-center justify-center text-center px-6 md:px-20 ml-3 mr-2 mb-3 py-10 rounded-2xl bg-lavender/60 bg-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${BgImage})` }}
      ></section>
    </main>
  );
}
