import type { JSX } from "react";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import MothballSVG from "../assets/favicon.svg";
import BgImage from "../assets/dddepth-267.jpg";

const filters = [
  { value: "all", label: "All" },
  { value: "to-upload", label: "To upload" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
] as const;

type Filter = (typeof filters)[number]["value"];

export default function ClosetPage(): JSX.Element {
  const [filter, setFilter] = useState<Filter>("all");

  const filterElements = filters.map(({ value, label }) => (
    <button
      type="button"
      key={value}
      onClick={() => setFilter(value)}
      className={`rounded-full px-4 py-2 whitespace-nowrap cursor-pointer  ${
        filter === value
          ? "bg-plum text-white hover:bg-plum/85"
          : "border border-lavender-gray text-ink hover:bg-lavender/50 hover:border-lilac hover:text-plum"
      }`}
    >
      {label}
    </button>
  ));

  return (
    <main
      className="flex flex-col min-h-screen bg-purple-700/35 bg-blend-multiply bg-cover bg-center"
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      <header className="flex items-center justify-between gap-2 pt-1 px-4">
        <div className="flex">
          <img src={MothballSVG} className="w-5" alt="Mothball icon" />
          <h1 className="text-3xl text-white font-gaegu font-bold">Mothball</h1>
        </div>
        <div className="flex gap-5">
          <button
            type="button"
            className="text-white hover:opacity-80 cursor-pointer"
          >
            Nataly
          </button>
          <p className="text-white">|</p>
          <button
            type="button"
            className="text-white hover:opacity-80 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="flex flex-1 gap-4 flex-col px-10 md:px-20 ml-3 mr-2 mb-3 py-10 rounded-2xl bg-white">
        <div className="flex justify-between">
          <h2 className="text-plum text-4xl font-bold">Our Closet</h2>
          <button
            type="button"
            className="bg-plum cursor-pointer relative right-1 before:content-['+'] before:mr-2 text-white px-5 rounded-md py-2 hover:bg-plum/80"
          >
            New item
          </button>
        </div>

        <div className="flex justify-between gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              size={22}
              className="text-plum absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              aria-label="Search items"
              type="text"
              placeholder="Search items"
              className="w-full rounded-md border border-lavender-gray pl-11 py-2 bg-white placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">{filterElements}</div>
        </div>
      </section>
    </main>
  );
}
