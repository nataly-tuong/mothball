import type { JSX } from "react";
import { useEffect } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import MothballSVG from "../assets/favicon.svg";
import BgImage from "../assets/dddepth-267.jpg";

export default function ClosetPage(): JSX.Element {
  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);

  const filters: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "to-upload", label: "To upload" },
    { value: "listed", label: "Listed" },
    { value: "sold", label: "Sold" },
  ];

  const filterElements = filters.map(({ value, label }) => (
    <button
      type="button"
      key={value}
      className="bg-plum text-white rounded-full whitespace-nowrap px-4 py-2 cursor-pointer hover:opacity-80 items-center"
    >
      {label}
    </button>
  ));

  return (
    <main className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between gap-2 pt-1 px-4">
        <div className="flex">
          <img src={MothballSVG} className="w-5" alt="Mothball icon" />
          <h1 className="text-3xl text-plum font-gaegu font-bold">Mothball</h1>
        </div>
        <div className="flex gap-5">
          <button className="text-plum hover:opacity-80 cursor-pointer">
            Nataly
          </button>
          <p className="text-plum">|</p>
          <button className="text-plum hover:opacity-80 cursor-pointer">
            Logout
          </button>
        </div>
      </header>

      <section
        className="flex flex-1 gap-4 flex-col px-10 md:px-20 ml-3 mr-2 mb-3 py-10 rounded-2xl bg-lavender/60 bg-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        <div className="flex justify-between">
          <h2 className="text-plum text-4xl font-bold">Our Closet</h2>
          <button
            type="submit"
            className="bg-plum cursor-pointer relative right-1 before:content-['+'] before:mr-2
    text-white px-5 rounded-md py-2 hover:bg-plum/80"
          >
            New item
          </button>
        </div>

        <div className="flex justify-between gap-3">
          <div className="relative w-full">
            <MagnifyingGlassIcon
              size={22}
              className="text-plum absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />

            <input
              aria-label="Add an item"
              type="text"
              placeholder="Search items"
              className="w-full rounded-md border border-lavender-gray pl-11 py-2 bg-white placeholder:text-gray-400"
            />
          </div>
          {filterElements}
        </div>
      </section>
    </main>
  );
}
