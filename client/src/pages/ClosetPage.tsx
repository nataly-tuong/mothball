import type { JSX } from "react";
import { useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import BgImage from "../assets/dddepth-267.jpg";
import Navbar from "../components/Navbar";

import type { SampleListing } from "../components/SampleListings";

type SampleListingsProps = {
  sampleListing: SampleListing[];
};

const filters = [
  { value: "all", label: "All" },
  { value: "to-upload", label: "To upload" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
] as const;

type Filter = (typeof filters)[number]["value"];

export default function ClosetPage({
  sampleListing,
}: SampleListingsProps): JSX.Element {
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

  const cardElements = sampleListing.map((listing) => (
    <li
      key={listing.name}
      className="overflow-hidden rounded-xl border border-lavender-gray bg-white shadow-sm shadow-plum/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-plum/15"
    >
      <img
        src={listing.imagePath}
        alt={listing.name}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="p-4">
        <h3 className="mb-3 font-bold text-plum">{listing.name}</h3>
        <select
          aria-label={`Status for ${listing.name}`}
          className="cursor-pointer rounded-full border border-lilac/40 bg-lavender/60 px-3 py-1 text-sm text-plum transition hover:bg-lavender focus-visible:outline-2 focus-visible:outline-lilac"
        >
          <option value="to upload">To upload</option>
        </select>
      </div>
    </li>
  ));

  return (
    <main
      className="flex flex-col min-h-screen bg-purple-700/35 bg-blend-multiply bg-cover bg-center"
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      <Navbar />

      <section className="relative flex flex-1 gap-4 flex-col px-10 md:px-20 ml-3 mr-2 mb-3 py-10 rounded-2xl border border-plum/15 ring-1 ring-white/40 shadow-lg shadow-plum/20 bg-white">
        <div className="flex justify-between">
          <h2 className="text-plum text-4xl font-bold">Our Closet</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-plum bg-gradient-to-b from-plum/80 to-plum px-5 py-2 text-sm font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-plum/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
          >
            <PlusIcon size={16} weight="bold" aria-hidden="true" />
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

        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {cardElements}
        </ul>
      </section>
    </main>
  );
}
