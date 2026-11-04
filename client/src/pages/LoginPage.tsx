import type { JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import MothballSVG from "../assets/favicon.svg";
import BgImage from "../assets/dddepth-061.jpg";
import { Link } from "react-router-dom";

export default function LoginPage(): JSX.Element {
  return (
    <main className="flex min-h-screen">
      <div
        className="flex flex-1  m-4 py-10 rounded-2xl flex-col items-center justify-center bg-lavender/60 bg-blend-overlay bg-cover bg-center"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
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
        <h2 className="text-3xl font-fredoka text-center text-plum font-medium mb-3">
          Syncs inventory.
        </h2>
        <p className="text-plum">
          "Uh, which one again? idk. oh <span className="italic">that one</span>
          "
        </p>
      </div>

      <div className="flex flex-col bg-white flex-1 px-10 items-center justify-center">
        <form className="flex flex-col w-full max-w-md px-5">
          <h2 className="text-3xl font-fredoka w-full font-medium text-plum mb-6">
            Log in
          </h2>

          <label htmlFor="email" className="text-plum font-bold mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="jane.doe@example.com"
            className="py-2.5 px-4 border border-lavender-gray rounded-lg mb-4"
          />

          <label htmlFor="password" className="text-plum font-bold mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="your password"
            className="py-2.5 px-4 border border-lavender-gray rounded-lg mb-3"
          />

          <div className="flex items-center justify-between mb-10">
            <label
              htmlFor="remember"
              className="flex items-center gap-2 text-sm text-plum cursor-pointer"
            >
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="w-4 h-4 accent-plum cursor-pointer"
              />
              Remember me
            </label>
            <a href="" className="text-sm text-lilac font-medium">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="bg-plum text-white py-2.5 rounded-lg text-sm font-medium"
          >
            Log in
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-lavender-gray" />
            <span className="text-sm text-plum/60">or</span>
            <div className="flex-1 h-px bg-lavender-gray" />
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 border border-lavender-gray bg-white text-plum py-2.5 rounded-lg text-sm font-medium hover:bg-lavender/40"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-center text-plum/50 mt-6">
            Don't have an account?{" "}
            <Link to={"/register"}>
              <a href="" className="text-lilac">
                Sign up
              </a>
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
