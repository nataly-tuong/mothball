import type { JSX } from "react";
import { useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import BgImage from "../assets/dddepth-267.jpg";
import Navbar from "../components/Navbar";

import placeholder from "../assets//pexels-thethomaseffect94-31794126.jpg";

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
      <Navbar />

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

        <div className="flex flex-1 flex-col border border-lavender-gray rounded-md max-h-[200px] max-w-[200px] overflow-hidden hover:shadow-sm">
          <img src={placeholder} className="h-[50%]" />
          <div className="p-3">
            <h3 className="font-bold mb-4">A Titled Cow</h3>
            <select className="border rounded-lg px-2 bg-lavender hover:opacity-50 cursor-pointer">
              <option value="to upload">To upload</option>
            </select>
          </div>
        </div>

      </section>
    </main>
  );
}
