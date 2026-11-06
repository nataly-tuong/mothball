import type { SubmitEvent, JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          remember: form.get("remember") === "on",
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message ?? "Something went wrong. Please try again");
        return;
      }

      await refreshUser();
      navigate("/closet");
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-md px-5"
    >
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

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-full border border-plum bg-gradient-to-b from-plum/80 to-plum py-2.5 text-sm font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-plum/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
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
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-plum/40 bg-gradient-to-b from-white to-lavender/60 py-2.5 text-sm font-medium text-plum shadow-sm shadow-plum/10 ring-1 ring-inset ring-white transition duration-200 hover:border-plum/60 hover:to-lavender hover:shadow-md hover:shadow-plum/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
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
