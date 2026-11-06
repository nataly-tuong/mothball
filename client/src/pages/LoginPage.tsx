import type { SubmitEvent, JSX } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

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
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col">
      <h2 className="mb-8 font-fredoka text-4xl font-medium text-plum">
        Log in
      </h2>

      <div className="mb-5 flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold text-plum">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="jane.doe@example.com"
          className="w-full rounded-lg border border-lavender-gray px-4 py-3 text-base"
        />
      </div>

      <div className="mb-4 flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold text-plum">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="your password"
          autoComplete="current-password"
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <label
          htmlFor="remember"
          className="flex cursor-pointer items-center gap-2 text-sm text-plum"
        >
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-plum"
          />
          Remember me
        </label>
        <Link to="/forgot-password" className="text-sm font-medium text-lilac">
          Forgot password?
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-plum bg-gradient-to-b from-plum/80 to-plum py-3 text-base font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-plum/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 disabled:active:scale-100"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-lavender-gray" />
        <span className="text-sm text-plum/60">or</span>
        <div className="h-px flex-1 bg-lavender-gray" />
      </div>

      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-plum/40 bg-gradient-to-b from-white to-lavender/60 py-3 text-base font-medium text-plum shadow-sm shadow-plum/10 ring-1 ring-inset ring-white transition duration-200 hover:border-plum/60 hover:to-lavender hover:shadow-md hover:shadow-plum/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
      >
        <FcGoogle className="h-5 w-5" />
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-plum/70">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-lilac">
          Sign up
        </Link>
      </p>
    </form>
  );
}
