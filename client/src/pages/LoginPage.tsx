import type { JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";

export default function LoginPage(): JSX.Element {
  return (
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
        <Link to="/forgot-password" className="text-sm text-lilac font-medium">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        className="bg-plum hover:bg-plum/80 cursor-pointer text-white py-2.5 rounded-lg text-sm font-medium"
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
        className="flex items-center cursor-pointer justify-center gap-2 border border-lavender-gray bg-white text-plum py-2.5 rounded-lg text-sm font-medium hover:bg-lavender/40"
      >
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </button>

      <p className="text-center text-plum/50 mt-6">
        Don't have an account?{" "}
        <Link to="/register" className="text-lilac">
          Sign up
        </Link>
      </p>
    </form>
  );
}
