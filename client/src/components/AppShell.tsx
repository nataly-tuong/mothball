import type { JSX, ReactNode } from "react";
import BgImage from "../assets/dddepth-267.jpg";
import Navbar from "./Navbar";
import InstallGuide from "./InstallGuide";
import MobileNav, { type MobileNavProps } from "./MobileNav";
import { getLastClosetId } from "../lib/closets";

export default function AppShell({
  children,
  nav,
  showNav = true,
}: {
  children: ReactNode;
  nav?: MobileNavProps;
  showNav?: boolean;
}): JSX.Element {
  const navProps = nav ?? { closetId: getLastClosetId() };
  const hasNav = showNav && navProps.closetId !== null;

  return (
    <main
      className="flex h-dvh flex-col overflow-hidden bg-purple-700/35 bg-blend-multiply bg-cover bg-center pt-[env(safe-area-inset-top)]"
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      <Navbar />

      <section
        className={`relative mx-2 min-h-0 flex-1 overflow-hidden rounded-2xl border border-plum/15 bg-white shadow-lg shadow-plum/20 ring-1 ring-white/40 sm:mb-3 sm:ml-3 sm:mr-2 ${
          hasNav ? "mb-0" : "mb-[max(0.5rem,env(safe-area-inset-bottom))]"
        }`}
      >
        <div className="flex h-full flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-10 sm:py-10 md:px-20">
          {children}
        </div>
      </section>

      {hasNav && <MobileNav {...navProps} />}

      <InstallGuide />
    </main>
  );
}
