import type { JSX } from "react";
import MothballSVG from "../assets/favicon.svg";

export default function LoginPage(): JSX.Element {
  return (
    <main className="flex items-center justify-center bg-lavender min-h-screen align-middle">
      <div className="flex flex-1 flex-col items-center justify-center min-h-screen">
        <img
          src={MothballSVG}
          className="mx-auto w-40"
          alt="Mothball Icon, Moth on a pearl"
        />
        <h1 className="text-7xl text-center text-plum font-gaegu font-extrabold mb-5">
          Mothball
        </h1>
        <h2 className="text-3xl font-fredoka text-center text-plum font-medium">
          Shared closet.
        </h2>
        <h2 className="text-4xl font-fredoka text-center text-plum font-medium mb-3">
          Syncs inventory.
        </h2>
        <p className="text-plum">
          "Uh,which one again? idk. oh <span className="italic">that one</span>"
        </p>
      </div>

      <div className="flex flex-col bg-white flex-1 min-h-screen px-10 items-center justify-center">
        <form className="flex flex-col gap-0.5 w-full px-5">
          <h2 className="text-3xl font-fredoka w-full font-medium text-plum mb-5">
            Log in
          </h2>
          <label className="text-plum font-bold">Email</label>
          <input
            name="email"
            type="email"
            placeholder="jane.doe@example.com"
            className="py-1 px-3 border border-lavender-gray rounded-lg mb-3"
          />
          <br />
          <label className=" text-plum font-bold">Password</label>
          <input
            name="password"
            type="password"
            placeholder="your password"
            className="py-1 px-3 border border-lavender-gray rounded-lg"
          />
          <br />
          <a
            href=""
            className="mx-auto w-full text-right text-lilac font-medium"
          >
            Forgot password?
          </a>
          <br />
        </form>
      </div>
    </main>
  );
}
