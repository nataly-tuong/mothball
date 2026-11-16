import type { JSX, ReactNode } from "react";
import BgImage from "../assets/dddepth-267.jpg";
import Navbar from "./Navbar";
import InstallGuide from "./InstallGuide";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <main
      className="flex flex-col min-h-screen bg-purple-700/35 bg-blend-multiply bg-cover bg-center"
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      <Navbar />

      <section className="relative flex flex-1 gap-4 flex-col px-6 sm:px-10 md:px-20 ml-3 mr-2 mb-3 py-10 rounded-2xl border border-plum/15 ring-1 ring-white/40 shadow-lg shadow-plum/20 bg-white">
        {children}
      </section>

      <InstallGuide />
    </main>
  );
}
