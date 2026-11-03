import type { JSX } from "react";
import MothballSVG from "../assets/favicon.svg";

export default function LoginPage(): JSX.Element {
  return (
    <main>
      <div className="flex justify-center bg-lavender min-h-screen">
        <img
          src={MothballSVG}
          className="w-50"
          alt="Mothball Icon, Moth on a pearl"
        />
      </div>
    </main>
  );
}
