import type { JSX } from "react";
import MothballSVG from "../assets/favicon.svg";

export default function LoginPage(): JSX.Element {
  return (
    <main>
      <div>
        <img src={MothballSVG} alt="Mothball Icon, Moth on a pearl" />
      </div>
    </main>
  );
}
